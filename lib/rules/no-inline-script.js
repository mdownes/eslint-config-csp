'use strict';

const { createHtmlRule } = require('./html-rule');

module.exports = createHtmlRule({
    name: 'no-inline-script',
    description: 'Disallow <script> elements that have no nonce, in HTML files and Lit templates.',
    kinds: ['inline-script'],
    defaults: {
        allowExternal: true,
    },
    extraProperties: {
        allowExternal: { type: 'boolean' },
    },
    checkerOptions(options) {
        return { allowExternalScripts: options.allowExternal !== false };
    },
    messages: {
        missingNonce: '<{{tag}}> has no nonce attribute. A strict Content Security Policy blocks it unless \'unsafe-inline\' is allowed.',
    },
});
