'use strict';

const { ruleMeta } = require('../meta');
const { checkHtml } = require('../html/check');
const { memberPropertyName, unwrap } = require('../ast');

/**
 * Sinks whose HTML is parsed as a document, so a <script> actually runs and
 * needs a nonce. innerHTML and insertAdjacentHTML do not run <script> tags;
 * those sinks still apply event handlers, javascript: URLs, and styles.
 */
const EXECUTING_SINKS = new Set(['write', 'writeln', 'srcdoc']);

const HTML_PROPERTIES = new Set(['innerHTML', 'outerHTML', 'srcdoc']);

const HTML_METHODS = new Set([
    'insertAdjacentHTML',
    'write',
    'writeln',
    'createContextualFragment',
    'unsafeHTML',
]);

/**
 * @param {object} node
 * @returns {string|null}
 */
function callName(node) {
    const value = unwrap(node);
    if (!value || value.type !== 'CallExpression') {
        return null;
    }

    const callee = unwrap(value.callee);
    if (!callee) {
        return null;
    }
    if (callee.type === 'Identifier') {
        return callee.name;
    }
    if (callee.type === 'MemberExpression') {
        return memberPropertyName(callee);
    }
    return null;
}

/**
 * @param {object|null|undefined} node
 * @param {string[]} allowCallees
 * @returns {boolean}
 */
function isAllowedProducer(node, allowCallees) {
    const value = unwrap(node);
    if (!value) {
        return false;
    }

    if (value.type === 'MemberExpression' && memberPropertyName(value) === 'emptyHTML') {
        return true;
    }

    if (value.type !== 'CallExpression') {
        return false;
    }

    const callee = unwrap(value.callee);
    const name = callee && callee.type === 'Identifier'
        ? callee.name
        : memberPropertyName(callee);

    if (name === 'createHTML') {
        return true;
    }

    return Boolean(name && allowCallees.includes(name));
}

/**
 * Classify a value passed to an HTML sink.
 * `mode` is `trusted`, `static`, or `dynamic`.
 * Static values include a concrete HTML string. Dynamic values may still
 * carry a partial HTML string built from the static pieces.
 * @param {object|null|undefined} node
 * @param {string[]} allowCallees
 * @returns {{mode: string, html: string|null}}
 */
function classify(node, allowCallees) {
    const value = unwrap(node);
    if (!value) {
        return { mode: 'dynamic', html: null };
    }

    if (isAllowedProducer(value, allowCallees)) {
        return { mode: 'trusted', html: null };
    }

    if (value.type === 'Literal' && typeof value.value === 'string') {
        return { mode: 'static', html: value.value };
    }

    if (value.type === 'Literal') {
        return { mode: 'static', html: String(value.value) };
    }

    if (value.type === 'TemplateLiteral') {
        const html = value.quasis.map((quasi, index) => {
            const cooked = quasi.value.cooked || '';
            return index < value.expressions.length ? cooked + 'cspExpr' : cooked;
        }).join('');

        if (value.expressions.length === 0) {
            return { mode: 'static', html };
        }

        return { mode: 'dynamic', html };
    }

    if (value.type === 'BinaryExpression' && value.operator === '+') {
        const left = classify(value.left, allowCallees);
        const right = classify(value.right, allowCallees);
        if (left.mode === 'trusted' || right.mode === 'trusted') {
            return { mode: 'dynamic', html: null };
        }
        const html = `${left.html == null ? 'cspExpr' : left.html}${right.html == null ? 'cspExpr' : right.html}`;
        if (left.mode === 'static' && right.mode === 'static') {
            return { mode: 'static', html };
        }
        return { mode: 'dynamic', html };
    }

    if (value.type === 'ConditionalExpression') {
        const consequent = classify(value.consequent, allowCallees);
        const alternate = classify(value.alternate, allowCallees);
        if (consequent.mode === 'trusted' && alternate.mode === 'trusted') {
            return { mode: 'trusted', html: null };
        }
        return { mode: 'dynamic', html: null };
    }

    if (value.type === 'SequenceExpression') {
        return classify(value.expressions[value.expressions.length - 1], allowCallees);
    }

    return { mode: 'dynamic', html: null };
}

/**
 * @param {Array<object>} violations
 * @param {boolean} executesScripts
 * @returns {Array<object>}
 */
function relevantViolations(violations, executesScripts) {
    if (executesScripts) {
        return violations;
    }
    return violations.filter((violation) => violation.kind !== 'inline-script');
}

/**
 * @param {Array<object>} violations
 * @returns {string}
 */
function describeViolations(violations) {
    const labels = [];
    for (const violation of violations) {
        if (violation.kind === 'inline-handler') {
            labels.push(`inline event handler ${violation.data.name}`);
        } else if (violation.kind === 'javascript-url') {
            labels.push('a javascript: URL');
        } else if (violation.kind === 'inline-style-attribute') {
            labels.push('an inline style attribute');
        } else if (violation.kind === 'inline-style-element') {
            labels.push('a <style> element without a nonce');
        } else if (violation.kind === 'inline-script') {
            labels.push('a <script> element without a nonce');
        }
    }

    return [...new Set(labels)].join(', ');
}

module.exports = {
    meta: ruleMeta({
        name: 'no-inner-html',
        description: 'Disallow HTML-sink assignments that a strict Content Security Policy or Trusted Types will reject.',
        schema: [{
            type: 'object',
            properties: {
                allowBenignLiterals: { type: 'boolean' },
                flagDynamic: { type: 'boolean' },
                allowCallees: {
                    type: 'array',
                    items: { type: 'string' },
                    uniqueItems: true,
                },
            },
            additionalProperties: false,
        }],
        messages: {
            unsafe: 'Passing markup to {{sink}} includes {{detail}}, which a strict Content Security Policy blocks.',
            dynamic: 'Dynamic HTML passed to {{sink}} can inject inline event handlers or styles that a strict Content Security Policy blocks. Use createHTML() or DOM APIs that do not parse markup.',
            untrusted: 'Passing a raw value to {{sink}} throws when Trusted Types is enforced (require-trusted-types-for \'script\'), which strict CSP deployments enable.',
        },
    }),
    create(context) {
        const options = {
            allowBenignLiterals: true,
            flagDynamic: true,
            allowCallees: [],
            ...(context.options[0] || {}),
        };

        /**
         * @param {object} reportNode
         * @param {string} sink
         * @param {object|null|undefined} valueNode
         * @param {boolean} executesScripts
         */
        function checkSink(reportNode, sink, valueNode, executesScripts) {
            if (!valueNode) {
                return;
            }

            if (isAllowedProducer(valueNode, options.allowCallees)) {
                return;
            }

            const classified = classify(valueNode, options.allowCallees);
            if (classified.mode === 'trusted') {
                return;
            }

            const violations = classified.html == null
                ? []
                : relevantViolations(checkHtml(classified.html), executesScripts);

            if (violations.length > 0) {
                context.report({
                    node: reportNode,
                    messageId: 'unsafe',
                    data: { sink, detail: describeViolations(violations) },
                });
                return;
            }

            if (classified.mode === 'dynamic') {
                if (options.flagDynamic) {
                    context.report({
                        node: reportNode,
                        messageId: 'dynamic',
                        data: { sink },
                    });
                }
                return;
            }

            if (!options.allowBenignLiterals) {
                context.report({
                    node: reportNode,
                    messageId: 'untrusted',
                    data: { sink },
                });
            }
        }

        return {
            AssignmentExpression(node) {
                const property = memberPropertyName(unwrap(node.left));
                if (!property || !HTML_PROPERTIES.has(property)) {
                    return;
                }

                checkSink(node, property, node.right, EXECUTING_SINKS.has(property));
            },
            CallExpression(node) {
                const name = callName(node);
                if (!name || !HTML_METHODS.has(name)) {
                    return;
                }

                if (name === 'write' || name === 'writeln') {
                    const objectName = memberPropertyName(unwrap(node.callee).object);
                    const objectIsDocument = objectName === 'document'
                        || (unwrap(node.callee).object && unwrap(node.callee).object.type === 'Identifier'
                            && unwrap(node.callee).object.name === 'document');
                    if (!objectIsDocument) {
                        return;
                    }
                }

                if (name === 'unsafeHTML' || name === 'createContextualFragment') {
                    if (node.arguments.length === 0) {
                        return;
                    }
                    checkSink(node, name, node.arguments[0], false);
                    return;
                }

                if (name === 'insertAdjacentHTML') {
                    checkSink(node, name, node.arguments[1], false);
                    return;
                }

                if (node.arguments.length === 0) {
                    return;
                }

                node.arguments.forEach((argument) => {
                    checkSink(node, `document.${name}`, argument, true);
                });
            },
        };
    },
};
