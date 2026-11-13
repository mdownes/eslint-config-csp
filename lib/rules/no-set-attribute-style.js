'use strict';

const { ruleMeta } = require('../meta');
const { literalString, memberPropertyName, setAttributeCall, unwrap } = require('../ast');

module.exports = {
    meta: ruleMeta({
        name: 'no-set-attribute-style',
        description: 'Disallow setAttribute(\'style\') and cssText assignments that write an inline style.',
        messages: {
            setAttribute: 'setAttribute(\'style\') writes an inline style, which style-src-attr blocks without \'unsafe-inline\'. Use a class or a constructable stylesheet.',
            cssText: 'Assigning to cssText writes an inline style, which style-src-attr blocks without \'unsafe-inline\'.',
        },
    }),
    create(context) {
        return {
            CallExpression(node) {
                const call = setAttributeCall(node);
                if (!call || call.name.toLowerCase() !== 'style') {
                    return;
                }

                context.report({ node: call.nameNode, messageId: 'setAttribute' });
            },
            AssignmentExpression(node) {
                const left = unwrap(node.left);
                if (memberPropertyName(left) !== 'cssText') {
                    return;
                }

                const value = literalString(node.right);
                if (value === '') {
                    return;
                }

                context.report({ node, messageId: 'cssText' });
            },
        };
    },
};
