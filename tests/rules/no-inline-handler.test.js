'use strict';

const rule = require('../../lib/rules/no-inline-handler');
const { html, tester, ts } = require('../helpers');

tester.run('no-inline-handler', rule, {
    valid: [
        'const view = html`<button type="button">OK</button>`;',
        'const view = foo`<button onclick="x"></button>`;',
        'const icon = svg`<svg><rect /></svg>`;',
        'el.addEventListener("click", handler);',
        'el.setAttribute("class", "on");',
        'const view = html`<button @click=${handler}>OK</button>`;',
        'const view = html`<div only="1" once="true"></div>`;',
        {
            ...html('<button type="button">OK</button>'),
        },
        {
            ...html('<!-- <button onclick="x"></button> -->'),
        },
        {
            ...html('<div only="1" once="2" one="3"></div>'),
        },
        ts('const view = html`<button type="button">${label as string}</button>`;'),
    ],
    invalid: [
        {
            code: 'const view = html`<button onclick="evil()">x</button>`;',
            errors: [{ messageId: 'handler', data: { name: 'onclick' } }],
        },
        {
            code: 'const view = html`<button onclick=${handler}></button>`;',
            errors: [{ messageId: 'handler', data: { name: 'onclick' } }],
        },
        {
            code: 'const view = html`\n  <img onerror="hack()">\n`;',
            errors: [{ messageId: 'handler', data: { name: 'onerror' }, line: 2 }],
        },
        {
            code: 'const picture = svg`<svg onload="hack()"></svg>`;',
            errors: [{ messageId: 'handler', data: { name: 'onload' } }],
        },
        {
            code: 'el.setAttribute("onclick", "evil()");',
            errors: [{ messageId: 'dom', data: { name: 'onclick' } }],
        },
        {
            code: 'el.setAttributeNS(null, "onmouseover", "evil()");',
            errors: [{ messageId: 'dom', data: { name: 'onmouseover' } }],
        },
        {
            ...html('<button onclick="evil()">x</button>'),
            errors: [{ messageId: 'handler', data: { name: 'onclick' }, line: 1, column: 9 }],
        },
        {
            ...html('<button ONCLICK="evil()">x</button>'),
            errors: [{ messageId: 'handler', data: { name: 'onclick' } }],
        },
        {
            ...html('<div>\n  <button onclick="x"></button>\n</div>'),
            errors: [{ messageId: 'handler', line: 2 }],
        },
        {
            ...html('<template><button onclick="x"></button></template>'),
            errors: [{ messageId: 'handler', data: { name: 'onclick' } }],
        },
        {
            ...html('<iframe srcdoc="<button onclick=\'x\'></button>"></iframe>'),
            errors: [{ messageId: 'handler' }],
        },
        {
            ...ts('const view = html`<img onerror=${onError} alt="">`;'),
            errors: [{ messageId: 'handler', data: { name: 'onerror' } }],
        },
        {
            code: 'const view = unsafeHtml`<button onclick="x"></button>`;',
            settings: { csp: { tags: ['unsafeHtml'] } },
            errors: [{ messageId: 'handler', data: { name: 'onclick' } }],
        },
    ],
});
