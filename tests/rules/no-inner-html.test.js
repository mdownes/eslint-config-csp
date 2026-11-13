'use strict';

const rule = require('../../lib/rules/no-inner-html');
const { tester, ts } = require('../helpers');

tester.run('no-inner-html', rule, {
    valid: [
        'el.textContent = "<b>ok</b>";',
        'el.innerHTML = "<b>hello</b>";',
        'el.innerHTML = "";',
        'el.innerHTML = "<script>alert(1)</script>";',
        'el.insertAdjacentHTML("beforeend", "<p>ok</p>");',
        'el.innerHTML = policy.createHTML(input);',
        'el.innerHTML = trustedTypes.emptyHTML;',
        {
            code: 'el.innerHTML = sanitize(input);',
            options: [{ allowCallees: ['sanitize'] }],
        },
        'const html = el.innerHTML;',
        'document.write();',
        ts('const el: HTMLElement = document.body; el.textContent = "<b>ok</b>";'),
    ],
    invalid: [
        {
            code: 'el.innerHTML = "<img onerror=\\"alert(1)\\">";',
            errors: [{
                messageId: 'unsafe',
                data: { sink: 'innerHTML', detail: 'inline event handler onerror' },
            }],
        },
        {
            code: 'el.innerHTML = "<div style=\\"color: red\\"></div>";',
            errors: [{ messageId: 'unsafe' }],
        },
        {
            code: 'el.outerHTML = "<a href=\\"javascript:alert(1)\\">x</a>";',
            errors: [{ messageId: 'unsafe' }],
        },
        {
            code: 'el.insertAdjacentHTML("beforeend", "<button onclick=\\"x\\"></button>");',
            errors: [{
                messageId: 'unsafe',
                data: { sink: 'insertAdjacentHTML', detail: 'inline event handler onclick' },
            }],
        },
        {
            code: 'el.innerHTML = input;',
            errors: [{ messageId: 'dynamic', data: { sink: 'innerHTML' } }],
        },
        {
            code: 'el.innerHTML = `<b>${name}</b>`;',
            errors: [{ messageId: 'dynamic' }],
        },
        {
            code: 'el.innerHTML = "<b>" + name + "</b>";',
            errors: [{ messageId: 'dynamic' }],
        },
        {
            code: 'unsafeHTML("<img onerror=alert(1)>");',
            errors: [{
                messageId: 'unsafe',
                data: { sink: 'unsafeHTML', detail: 'inline event handler onerror' },
            }],
        },
        {
            code: 'document.write("<script>alert(1)</script>");',
            errors: [{ messageId: 'unsafe' }],
        },
        {
            code: 'range.createContextualFragment("<img onerror=alert(1)>");',
            errors: [{
                messageId: 'unsafe',
                data: {
                    sink: 'createContextualFragment',
                    detail: 'inline event handler onerror',
                },
            }],
        },
        {
            code: 'document.writeln("<div onclick=\\"x\\"></div>");',
            errors: [{ messageId: 'unsafe' }],
        },
        {
            code: 'frame.srcdoc = "<script>alert(1)</script>";',
            errors: [{
                messageId: 'unsafe',
                data: { sink: 'srcdoc', detail: 'a <script> element without a nonce' },
            }],
        },
        {
            code: 'el.innerHTML = "<b>hello</b>";',
            options: [{ allowBenignLiterals: false }],
            errors: [{ messageId: 'untrusted', data: { sink: 'innerHTML' } }],
        },
        {
            code: 'el.innerHTML = "<script>alert(1)</script>";',
            options: [{ allowBenignLiterals: false }],
            errors: [{ messageId: 'untrusted' }],
        },
        {
            ...ts('function render(el: HTMLElement, html: string): void { el.innerHTML = html; }'),
            errors: [{ messageId: 'dynamic' }],
        },
        {
            ...ts('function paint(el: Element): void { el.innerHTML = "<div style=\\"color:red\\"></div>" as string; }'),
            errors: [{ messageId: 'unsafe' }],
        },
    ],
});
