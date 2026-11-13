'use strict';

const { createHtmlRule } = require('./html-rule');
const { isJavascriptUrl } = require('../html/javascript-url');
const { isGlobalObject, isGlobalReference, memberPropertyName, setAttributeCall, unwrap } = require('../ast');

const URL_PROPERTIES = new Set([
    'href',
    'src',
    'action',
    'formaction',
    'data',
    'poster',
    'location',
]);

const URL_METHODS = new Set(['assign', 'replace', 'open']);

/**
 * @param {object|null|undefined} node
 * @returns {string|null}
 */
function javascriptString(node) {
    const value = unwrap(node);
    if (!value) {
        return null;
    }

    if (value.type === 'Literal' && typeof value.value === 'string') {
        return isJavascriptUrl(value.value) ? value.value : null;
    }

    if (value.type === 'TemplateLiteral') {
        const prefix = (value.quasis[0] && value.quasis[0].value.cooked) || '';
        if (isJavascriptUrl(prefix)) {
            return prefix;
        }
    }

    return null;
}

module.exports = createHtmlRule({
    name: 'no-javascript-url',
    description: 'Disallow javascript: URLs in HTML, Lit templates, and DOM URL sinks.',
    kinds: ['javascript-url'],
    messages: {
        url: '\'javascript:\' URL in {{name}} is blocked by script-src without \'unsafe-inline\'.',
    },
    extraVisitors(context) {
        /**
         * @param {object} node
         * @param {string} name
         */
        function report(node, name) {
            context.report({
                node,
                messageId: 'url',
                data: { name },
            });
        }

        return {
            AssignmentExpression(node) {
                if (!javascriptString(node.right)) {
                    return;
                }

                const left = unwrap(node.left);
                if (left && left.type === 'Identifier' && left.name === 'location') {
                    report(node.right, 'location');
                    return;
                }

                const property = memberPropertyName(left);
                if (property && (URL_PROPERTIES.has(property) || property.toLowerCase() === 'href')) {
                    report(node.right, property);
                }
            },
            CallExpression(node) {
                const call = setAttributeCall(node);
                if (call && javascriptString(call.valueNode)) {
                    const name = call.name.toLowerCase();
                    if (URL_PROPERTIES.has(name) || name === 'xlink:href') {
                        report(call.valueNode, name);
                    }
                }

                const callee = unwrap(node.callee);
                const property = memberPropertyName(callee);
                const first = node.arguments[0];
                if (!property || !first || !javascriptString(first)) {
                    return;
                }

                if (property === 'open' && callee && isGlobalObject(context, callee.object)) {
                    report(first, 'open');
                    return;
                }

                if ((property === 'assign' || property === 'replace') && URL_METHODS.has(property)) {
                    const objectProperty = memberPropertyName(callee.object) || (callee.object && callee.object.name);
                    if (objectProperty === 'location' || isGlobalReference(context, callee.object, 'location')) {
                        report(first, property);
                    }
                }
            },
        };
    },
});
