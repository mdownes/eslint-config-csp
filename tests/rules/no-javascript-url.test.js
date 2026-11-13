'use strict';

const rule = require('../../lib/rules/no-javascript-url');
const { html, tester, ts } = require('../helpers');

tester.run('no-javascript-url', rule, {
    valid: [
        'const view = html`<a href="https://example.com">docs</a>`;',
        'el.href = "https://example.com";',
        'location.href = "/home";',
        'window.open("https://example.com");',
        'const note = "javascript: is a scheme";',
        {
            ...html('<a href="https://example.com">docs</a>'),
        },
        {
            ...html('<a href=" javascript-not-a-url">x</a>'),
        },
        ts('const href: string = "https://example.com";'),
    ],
    invalid: [
        {
            code: 'const view = html`<a href="javascript:alert(1)">x</a>`;',
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            code: 'const view = html`<a href="javascript:${code}">x</a>`;',
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            code: 'const view = html`<form action="javascript:void(0)"></form>`;',
            errors: [{ messageId: 'url', data: { name: 'action' } }],
        },
        {
            code: 'el.href = "javascript:alert(1)";',
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            code: 'location.href = "javascript:alert(1)";',
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            code: 'window.location = "javascript:alert(1)";',
            errors: [{ messageId: 'url', data: { name: 'location' } }],
        },
        {
            code: 'location.assign("javascript:alert(1)");',
            errors: [{ messageId: 'url', data: { name: 'assign' } }],
        },
        {
            code: 'window.open(`javascript:${payload}`);',
            errors: [{ messageId: 'url', data: { name: 'open' } }],
        },
        {
            code: 'el.setAttribute("href", "javascript:alert(1)");',
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            ...html('<a href="javascript:alert(1)">x</a>'),
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
        {
            ...html('<a href="  javascript:alert(1)">x</a>'),
            errors: [{ messageId: 'url' }],
        },
        {
            ...html('<a href="javascript&#58;alert(1)">x</a>'),
            errors: [{ messageId: 'url' }],
        },
        {
            ...html('<a href="&#106;avascript:alert(1)">x</a>'),
            errors: [{ messageId: 'url' }],
        },
        {
            ...html('<svg><a xlink:href="javascript:alert(1)"></a></svg>'),
            errors: [{ messageId: 'url', data: { name: 'xlink:href' } }],
        },
        {
            ...html('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'),
            errors: [{ messageId: 'url', data: { name: 'content' } }],
        },
        {
            ...html('<iframe src="javascript:alert(1)"></iframe>'),
            errors: [{ messageId: 'url', data: { name: 'src' } }],
        },
        {
            ...html('<div style="background: url(javascript:alert(1))"></div>'),
            errors: [{ messageId: 'url', data: { name: 'style' } }],
        },
        {
            ...ts('const view = html`<a href="JavaScript:alert(1)"></a>`;'),
            errors: [{ messageId: 'url', data: { name: 'href' } }],
        },
    ],
});
