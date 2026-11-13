'use strict';

const rule = require('../../lib/rules/no-inline-style');
const { html, tester, ts } = require('../helpers');

tester.run('no-inline-style', rule, {
    valid: [
        'const view = html`<div class="panel"></div>`;',
        'const view = html`<style nonce=${nonce}>.a{}</style>`;',
        'const view = html`<link rel="stylesheet" href="app.css">`;',
        {
            ...html('<div class="panel"></div>'),
        },
        {
            ...html('<style nonce="abc">.a{}</style>'),
        },
        {
            ...html('<link rel="stylesheet" href="/app.css">'),
        },
        ts('const view = html`<p class=${klass as string}></p>`;'),
    ],
    invalid: [
        {
            code: 'const view = html`<div style="color: red"></div>`;',
            errors: [{ messageId: 'attribute' }],
        },
        {
            code: 'const view = html`<div style=${styleMap(styles)}></div>`;',
            errors: [{ messageId: 'attribute' }],
        },
        {
            code: 'const view = html`<style>.a { color: red; }</style>`;',
            errors: [{ messageId: 'element' }],
        },
        {
            code: 'const view = html`<div style="background: url(javascript:alert(1))"></div>`;',
            errors: [
                { messageId: 'attribute' },
            ],
        },
        {
            ...html('<div style="color: red"></div>'),
            errors: [{ messageId: 'attribute', line: 1, column: 6 }],
        },
        {
            ...html('<style>.a{}</style>'),
            errors: [{ messageId: 'element' }],
        },
        {
            ...html('<div>\n  <span style="color: red"></span>\n</div>'),
            errors: [{ messageId: 'attribute', line: 2 }],
        },
        {
            ...ts('const view = html`<style>${css as string}</style>`;'),
            errors: [{ messageId: 'element' }],
        },
    ],
});
