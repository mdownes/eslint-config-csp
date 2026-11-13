'use strict';

const { createHtmlRule } = require('./html-rule');

module.exports = createHtmlRule({
    name: 'no-inline-style',
    description: 'Disallow inline style attributes and <style> elements without a nonce.',
    kinds: ['inline-style-attribute', 'inline-style-element'],
    messages: {
        attribute: 'Inline style attribute is blocked by style-src-attr unless \'unsafe-inline\' is allowed. Use a class or a constructable stylesheet.',
        element: '<style> has no nonce attribute. style-src without \'unsafe-inline\' will block it.',
    },
});
