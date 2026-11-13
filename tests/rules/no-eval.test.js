'use strict';

const rule = require('../../lib/rules/no-eval');
const { tester, ts } = require('../helpers');

tester.run('no-eval', rule, {
    valid: [
        'const value = 1;',
        'function demo(value) { return value; }',
        'obj.eval("nope");',
        {
            code: 'function eval(value) { return value; } eval(1);',
            languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
        },
        ts('const value: number = 1; console.log(value);'),
    ],
    invalid: [
        {
            code: 'eval("alert(1)")',
            errors: [{ messageId: 'eval' }],
        },
        {
            code: 'window.eval("alert(1)")',
            errors: [{ messageId: 'eval' }],
        },
        {
            code: 'globalThis.eval("alert(1)")',
            errors: [{ messageId: 'eval' }],
        },
        {
            code: '(0, eval)("alert(1)")',
            errors: [{ messageId: 'eval' }],
        },
        {
            code: 'window["eval"]("alert(1)")',
            errors: [{ messageId: 'eval' }],
        },
        {
            ...ts('const run = (code: string): unknown => eval(code);'),
            errors: [{ messageId: 'eval' }],
        },
    ],
});
