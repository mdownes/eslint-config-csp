# csp/no-set-attribute-style

Disallow JavaScript that writes the inline `style` attribute: `setAttribute("style", ...)`, `setAttributeNS(..., "style", ...)`, and assignments to `style.cssText`.

`style-src-attr` (and, where that directive is absent, `style-src`) blocks inline styles unless the policy allows `'unsafe-inline'`. Clearing the attribute with `cssText = ""` is allowed.

This replaces the `no-restricted-syntax` selector shipped by `eslint-config-csp` 1.x. That config told you to use `element.style` instead. Individual CSSOM writes such as `element.style.color = "red"` are also blocked by `style-src-attr` in Chromium, so this rule does not recommend them. It does not flag those property writes, because they are extremely common and noisy; prefer a class or a constructable stylesheet (`adoptedStyleSheets` / `CSSStyleSheet`).

## Rule details

Examples of **incorrect** code:

```js
el.setAttribute("style", "color: red");
el.setAttribute("STYLE", "color: red");
el.setAttributeNS(null, "style", "color: red");
el.style.cssText = "color: red";
el.style.cssText += extra;
```

Examples of **correct** code:

```js
el.classList.add("warning");
el.style.cssText = "";
```

Markup is covered by [`csp/no-inline-style`](./no-inline-style.md), including `style=""` inside Lit templates and `.html` files.

## Options

This rule has no options.

## When not to use it

Don't enable it if the policy explicitly allows inline styles via `'unsafe-inline'` on `style-src-attr`.

## Further reading

- [MDN: `style-src-attr`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src-attr)
- [MDN: constructable stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet)
