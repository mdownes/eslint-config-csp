'use strict';

const { ruleMeta } = require('../meta');
const { isGlobalObject, isGlobalReference, memberPropertyName, unwrap } = require('../ast');

/**
 * @param {object} context
 * @param {object|null|undefined} node
 * @returns {boolean}
 */
function isFunctionConstructor(context, node) {
    const value = unwrap(node);
    if (!value) {
        return false;
    }

    if (isGlobalReference(context, value, 'Function')) {
        return true;
    }

    if (memberPropertyName(value) !== 'Function') {
        return false;
    }

    return isGlobalObject(context, value.object);
}

module.exports = {
    meta: ruleMeta({
        name: 'no-new-func',
        description: 'Disallow the Function constructor, which CSP treats as eval.',
        messages: {
            func: 'The Function constructor evaluates strings and is blocked unless script-src includes \'unsafe-eval\'.',
        },
    }),
    create(context) {
        return {
            NewExpression(node) {
                if (!isFunctionConstructor(context, node.callee)) {
                    return;
                }
                context.report({ node: node.callee, messageId: 'func' });
            },
            CallExpression(node) {
                if (!isFunctionConstructor(context, node.callee)) {
                    return;
                }
                context.report({ node: node.callee, messageId: 'func' });
            },
        };
    },
};
