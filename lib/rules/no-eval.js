'use strict';

const { ruleMeta } = require('../meta');
const { isGlobalObject, isGlobalReference, memberPropertyName, unwrap } = require('../ast');

/**
 * @param {object} context
 * @param {object} node
 * @returns {boolean}
 */
function isEvalCallee(context, node) {
    let callee = unwrap(node.callee);
    if (callee && callee.type === 'SequenceExpression') {
        callee = unwrap(callee.expressions[callee.expressions.length - 1]);
    }

    if (isGlobalReference(context, callee, 'eval')) {
        return true;
    }

    const property = memberPropertyName(callee);
    if (property !== 'eval') {
        return false;
    }

    return isGlobalObject(context, callee.object);
}

module.exports = {
    meta: ruleMeta({
        name: 'no-eval',
        description: 'Disallow eval(), which CSP blocks unless script-src includes \'unsafe-eval\'.',
        messages: {
            eval: 'eval() is blocked by Content Security Policy unless script-src includes \'unsafe-eval\'.',
        },
    }),
    create(context) {
        return {
            CallExpression(node) {
                if (!isEvalCallee(context, node)) {
                    return;
                }

                context.report({ node: node.callee, messageId: 'eval' });
            },
        };
    },
};
