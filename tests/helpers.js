'use strict';

const { RuleTester } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const htmlParser = require('@html-eslint/parser');

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
});

/**
 * @param {string} code
 * @returns {{code: string, filename: string, languageOptions: object}}
 */
function ts(code) {
    return {
        code,
        filename: 'fixture.ts',
        languageOptions: {
            parser: tsParser,
        },
    };
}

/**
 * @param {string} code
 * @returns {{code: string, filename: string, languageOptions: object}}
 */
function html(code) {
    return {
        code,
        filename: 'fixture.html',
        languageOptions: {
            parser: htmlParser,
        },
    };
}

module.exports = {
    html,
    tester,
    ts,
};
