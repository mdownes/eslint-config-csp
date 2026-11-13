'use strict';

const { ruleMeta } = require('../meta');
const { isGlobalReference, isStringExpression, memberPropertyName, unwrap } = require('../ast');

const IMPLIED_EVAL = new Set(['setTimeout', 'setInterval', 'setImmediate', 'execScript']);

/**
 * @param {object} context
 * @param {object} node
 * @returns {string|null}
 */
function impliedEvalName(context, node) {
    let callee = unwrap(node.callee);
    if (callee && callee.type === 'SequenceExpression') {
        callee = unwrap(callee.expressions[callee.expressions.length - 1]);
    }

    if (callee && callee.type === 'Identifier' && IMPLIED_EVAL.has(callee.name)) {
        return isGlobalReference(context, callee, callee.name) ? callee.name : null;
    }

    // `window.setTimeout("code")` and `timer.setTimeout("code")` are the same
    // bug. A shadowed bare `setTimeout(...)` is handled above and ignored.
    const property = memberPropertyName(callee);
    if (!property || !IMPLIED_EVAL.has(property)) {
        return null;
    }

    return property;
}

module.exports = {
    meta: ruleMeta({
        name: 'no-implied-eval',
        description: 'Disallow setTimeout, setInterval, setImmediate, and execScript with a string argument.',
        messages: {
            implied: 'Passing a string to {{name}}() is an implied eval and is blocked unless script-src includes \'unsafe-eval\'.',
        },
    }),
    create(context) {
        return {
            CallExpression(node) {
                const name = impliedEvalName(context, node);
                if (!name) {
                    return;
                }

                const first = node.arguments[0];
                if (!isStringExpression(first)) {
                    return;
                }

                context.report({
                    node: first,
                    messageId: 'implied',
                    data: { name },
                });
            },
        };
    },
};
