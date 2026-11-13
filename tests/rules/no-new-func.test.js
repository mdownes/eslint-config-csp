'use strict';

const rule = require('../../lib/rules/no-new-func');
const { tester, ts } = require('../helpers');

tester.run('no-new-func', rule, {
    valid: [
        'function hello() { return 1; }',
        'new MyFunction("return 1");',
        'obj.Function("return 1");',
        {
            code: 'function Function() { return 1; } new Function();',
            languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
        },
        ts('function hello(): number { return 1; }'),
    ],
    invalid: [
        {
            code: 'new Function("return 1");',
            errors: [{ messageId: 'func' }],
        },
        {
            code: 'Function("return 1");',
            errors: [{ messageId: 'func' }],
        },
        {
            code: 'new window.Function("a", "return a");',
            errors: [{ messageId: 'func' }],
        },
        {
            code: 'globalThis.Function("return 1");',
            errors: [{ messageId: 'func' }],
        },
        {
            ...ts('const fn = new Function("return 1") as () => number;'),
            errors: [{ messageId: 'func' }],
        },
    ],
});
