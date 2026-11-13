'use strict';

const rule = require('../../lib/rules/no-implied-eval');
const { tester, ts } = require('../helpers');

tester.run('no-implied-eval', rule, {
    valid: [
        'setTimeout(function () {}, 0);',
        'setTimeout(() => {}, 10);',
        'window.setInterval(handler, 10);',
        'setTimeout(handler, 0);',
        'obj.setTimeout(handler, 0);',
        {
            code: 'function setTimeout(fn) { return fn; } setTimeout("not-the-global");',
            languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
        },
        ts('window.setTimeout(() => {}, 0);'),
    ],
    invalid: [
        {
            code: 'setTimeout("alert(1)", 0);',
            errors: [{ messageId: 'implied', data: { name: 'setTimeout' } }],
        },
        {
            code: 'setInterval("tick()", 10);',
            errors: [{ messageId: 'implied', data: { name: 'setInterval' } }],
        },
        {
            code: 'window.setTimeout(`alert(1)`, 0);',
            errors: [{ messageId: 'implied', data: { name: 'setTimeout' } }],
        },
        {
            code: 'setTimeout("a" + code, 0);',
            errors: [{ messageId: 'implied', data: { name: 'setTimeout' } }],
        },
        {
            code: 'globalThis.setInterval(`code${id}`, 1);',
            errors: [{ messageId: 'implied', data: { name: 'setInterval' } }],
        },
        {
            code: 'execScript("alert(1)");',
            errors: [{ messageId: 'implied', data: { name: 'execScript' } }],
        },
        {
            ...ts('window.setTimeout("nope", 1 as number);'),
            errors: [{ messageId: 'implied', data: { name: 'setTimeout' } }],
        },
    ],
});
