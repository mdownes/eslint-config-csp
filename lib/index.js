'use strict';

const { name, version } = require('../package.json');
const { createConfigs, defineHtmlConfig } = require('./configs');

const plugin = {
    meta: {
        name,
        version,
    },
    rules: {
        'no-eval': require('./rules/no-eval'),
        'no-implied-eval': require('./rules/no-implied-eval'),
        'no-new-func': require('./rules/no-new-func'),
        'no-set-attribute-style': require('./rules/no-set-attribute-style'),
        'no-inline-handler': require('./rules/no-inline-handler'),
        'no-javascript-url': require('./rules/no-javascript-url'),
        'no-inline-script': require('./rules/no-inline-script'),
        'no-inline-style': require('./rules/no-inline-style'),
        'no-inner-html': require('./rules/no-inner-html'),
    },
    configs: {},
};

Object.assign(plugin.configs, createConfigs(plugin));

/**
 * Flat config block for standalone .html files.
 * `mode: "language"` (default) uses ESLint's `language: "html/html"` API and
 * needs `@html-eslint/eslint-plugin` (ESLint 9 or 10). `mode: "parser"` sets
 * `languageOptions.parser` to `@html-eslint/parser`, which also works on ESLint 8.
 * @param {{strict?: boolean, mode?: 'language'|'parser', files?: string[]}} [options]
 */
plugin.defineHtmlConfig = function defineHtml(options) {
    return defineHtmlConfig(plugin, options);
};

module.exports = plugin;
