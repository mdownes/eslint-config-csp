'use strict';

const rule = require('../../lib/rules/no-set-attribute-style');
const { tester, ts } = require('../helpers');

tester.run('no-set-attribute-style', rule, {
    valid: [
        'el.setAttribute("class", "panel");',
        'el.setAttribute("id", "root");',
        'el.style.color = "red";',
        'el.style.cssText = "";',
        ts('const el: HTMLElement = document.body; el.setAttribute("class", "ok");'),
    ],
    invalid: [
        {
            code: 'el.setAttribute("style", "color: red");',
            errors: [{ messageId: 'setAttribute' }],
        },
        {
            code: "el.setAttribute('STYLE', 'color: red');",
            errors: [{ messageId: 'setAttribute' }],
        },
        {
            code: 'el.setAttributeNS(null, "style", "color: red");',
            errors: [{ messageId: 'setAttribute' }],
        },
        {
            code: 'el.style.cssText = "color: red";',
            errors: [{ messageId: 'cssText' }],
        },
        {
            code: 'el.style.cssText += extra;',
            errors: [{ messageId: 'cssText' }],
        },
        {
            ...ts('function paint(el: HTMLElement): void { el.setAttribute("style", "color: red"); }'),
            errors: [{ messageId: 'setAttribute' }],
        },
    ],
});
