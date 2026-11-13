'use strict';

const rule = require('../../lib/rules/no-inline-script');
const { html, tester, ts } = require('../helpers');

tester.run('no-inline-script', rule, {
    valid: [
        'const view = html`<script nonce=${nonce}>app()</script>`;',
        'const view = html`<script src="app.js"></script>`;',
        'const view = html`<script type="application/json">{"a":1}</script>`;',
        {
            ...html('<script nonce="abc">app()</script>'),
        },
        {
            ...html('<script src="app.js"></script>'),
        },
        {
            ...html('<script type="application/ld+json">{}</script>'),
        },
        {
            ...html('<script src="app.js" nonce="abc"></script>'),
        },
        {
            code: 'const view = html`<script src=${src}></script>`;',
        },
        ts('const view = html`<script nonce=${id as string}></script>`;'),
    ],
    invalid: [
        {
            code: 'const view = html`<script>alert(1)</script>`;',
            errors: [{ messageId: 'missingNonce', data: { tag: 'script' } }],
        },
        {
            code: 'const view = html`<script type="module">import "./a.js";</script>`;',
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            code: 'const view = html`\n<script>\nalert(1)\n</script>`;',
            errors: [{ messageId: 'missingNonce', line: 2 }],
        },
        {
            ...html('<script>alert(1)</script>'),
            errors: [{ messageId: 'missingNonce', line: 1, column: 1 }],
        },
        {
            ...html('<script nonce>app()</script>'),
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            ...html('<script type="module" src="app.js"></script>'),
            options: [{ allowExternal: false }],
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            ...html('<script src="app.js"></script>'),
            options: [{ allowExternal: false }],
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            ...html('<script type="importmap">{}</script>'),
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            ...html('<head><script>app()</script></head>'),
            errors: [{ messageId: 'missingNonce' }],
        },
        {
            ...ts('const view = html`<script>console.log(1 as number)</script>`;'),
            errors: [{ messageId: 'missingNonce' }],
        },
    ],
});
