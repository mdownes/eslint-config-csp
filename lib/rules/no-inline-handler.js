'use strict';

const { createHtmlRule } = require('./html-rule');
const { isEventHandlerAttribute } = require('../html/event-handlers');
const { setAttributeCall } = require('../ast');

module.exports = createHtmlRule({
    name: 'no-inline-handler',
    description: 'Disallow inline on* event handler attributes, including in Lit templates and HTML files.',
    kinds: ['inline-handler'],
    messages: {
        handler: 'Inline event handler \'{{name}}\' is blocked by a Content Security Policy that does not allow \'unsafe-inline\'.',
        dom: 'Calling setAttribute() with \'{{name}}\' installs an inline event handler, which a strict Content Security Policy blocks.',
    },
    extraVisitors(context) {
        return {
            CallExpression(node) {
                const call = setAttributeCall(node);
                if (!call || !isEventHandlerAttribute(call.name)) {
                    return;
                }

                context.report({
                    node: call.nameNode,
                    messageId: 'dom',
                    data: { name: call.name.toLowerCase() },
                });
            },
        };
    },
});
