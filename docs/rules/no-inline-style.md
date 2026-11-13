# csp/no-inline-style

Disallow inline style attributes and `<style>` elements that have no nonce.

`style-src-attr` blocks the `style` attribute unless `'unsafe-inline'` is allowed. A `<style>` element is allowed when it carries the nonce from `style-src 'nonce-...'`. External stylesheets (`<link rel="stylesheet">`) are not this rule's problem; allow-list them with `style-src` or serve them same-origin.

Lit's `style=${styleMap(...)}` still renders a `style` attribute, so it is reported. Use a class.

JavaScript `setAttribute("style")` and `cssText` are reported by [`csp/no-set-attribute-style`](./no-set-attribute-style.md).

## Rule details

Examples of **incorrect** code:

```js
const view = html`<div style="color: red"></div>`;
const view = html`<div style=${styleMap(styles)}></div>`;
const view = html`<style>.a { color: red; }</style>`;
```

```html
<div style="color: red"></div>
<style>.a {}</style>
```

Examples of **correct** code:

```js
const view = html`<div class="warning"></div>`;
const view = html`<style nonce=${nonce}>.a { color: red; }</style>`;
const view = html`<link rel="stylesheet" href="/app.css">`;
```

```html
<div class="warning"></div>
<style nonce="server-generated">.a {}</style>
<link rel="stylesheet" href="/app.css">
```

An empty `nonce` does not count. A `javascript:` URL inside a style value is also reported by [`csp/no-javascript-url`](./no-javascript-url.md).

## Options

`tags` works the same way as in [`csp/no-inline-handler`](./no-inline-handler.md).

## When not to use it

Don't enable it when `style-src` and `style-src-attr` intentionally allow `'unsafe-inline'`.

## Further reading

- [MDN: `style-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src)
- [MDN: `style-src-attr`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src-attr)
