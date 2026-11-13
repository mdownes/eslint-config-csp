'use strict';

const SOURCE_FILES = ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'];

/**
 * Markup rules. `strict` requires a nonce even on <script src>, which is
 * what `strict-dynamic` CSP does for parser-inserted scripts.
 * @param {boolean} strict
 * @returns {Record<string, string|Array>}
 */
function markupRules(strict) {
    return {
        'csp/no-inline-handler': 'error',
        'csp/no-javascript-url': 'error',
        'csp/no-inline-script': strict ? ['error', { allowExternal: false }] : 'error',
        'csp/no-inline-style': 'error',
    };
}

/**
 * @param {boolean} strict
 * @returns {Record<string, string|Array>}
 */
function allRules(strict) {
    return {
        'csp/no-eval': 'error',
        'csp/no-implied-eval': 'error',
        'csp/no-new-func': 'error',
        'csp/no-set-attribute-style': 'error',
        'csp/no-inner-html': strict
            ? ['error', { allowBenignLiterals: false }]
            : 'error',
        ...markupRules(strict),
    };
}

/**
 * @param {object} plugin
 * @param {{strict?: boolean, mode?: 'language'|'parser', files?: string[]}} [options]
 */
function defineHtmlConfig(plugin, options = {}) {
    const mode = options.mode || 'language';
    const files = options.files || ['**/*.html'];
    const rules = markupRules(Boolean(options.strict));

    if (mode === 'parser') {
        let parser;
        try {
            parser = require('@html-eslint/parser');
        } catch (error) {
            throw new Error(
                'eslint-plugin-csp defineHtmlConfig({ mode: "parser" }) requires the optional peer @html-eslint/parser. Install it with `npm install -D @html-eslint/parser`.',
                { cause: error },
            );
        }

        return {
            files,
            plugins: { csp: plugin },
            languageOptions: { parser },
            rules,
        };
    }

    if (mode !== 'language') {
        throw new Error('defineHtmlConfig mode must be "language" or "parser".');
    }

    let htmlPlugin;
    try {
        htmlPlugin = require('@html-eslint/eslint-plugin');
    } catch (error) {
        throw new Error(
            'eslint-plugin-csp defineHtmlConfig() requires the optional peer @html-eslint/eslint-plugin. Install it with `npm install -D @html-eslint/eslint-plugin @html-eslint/parser`. On ESLint 8, call defineHtmlConfig({ mode: "parser" }) instead.',
            { cause: error },
        );
    }

    return {
        files,
        plugins: {
            html: htmlPlugin,
            csp: plugin,
        },
        language: 'html/html',
        rules,
    };
}

/**
 * @param {object} plugin
 */
function createConfigs(plugin) {
    const recommendedRules = allRules(false);
    const strictRules = allRules(true);

    return {
        recommended: {
            files: SOURCE_FILES,
            plugins: { csp: plugin },
            rules: recommendedRules,
        },
        strict: {
            files: SOURCE_FILES,
            plugins: { csp: plugin },
            rules: strictRules,
        },
        // eslintrc configs for ESLint 8 projects that have not moved to flat config.
        'legacy-recommended': {
            plugins: ['csp'],
            rules: recommendedRules,
        },
        'legacy-strict': {
            plugins: ['csp'],
            rules: strictRules,
        },
    };
}

module.exports = {
    SOURCE_FILES,
    allRules,
    createConfigs,
    defineHtmlConfig,
    markupRules,
};
