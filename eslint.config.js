'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const csp = require('./index.js');

module.exports = [
    {
        ignores: ['node_modules/**', 'coverage/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            csp,
        },
        rules: {
            ...csp.configs.recommended.rules,
            semi: ['error', 'always'],
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
];
