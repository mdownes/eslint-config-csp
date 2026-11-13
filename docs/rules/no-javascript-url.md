# csp/no-javascript-url

Disallow `javascript:` URLs. Script-src without `'unsafe-inline'` blocks them.

Checked surfaces:

- URL attributes in Lit `html` / `svg` templates and in `.html` files: `href`, `src`, `action`, `formaction`, `xlink:href`, `data` (on `<object>`), `poster`, `background`, `cite`, `srcset`, and `ping`
- `style` values that contain `url(javascript:...)`
- `<meta http-equiv="refresh" content="...url=javascript:...">`
- JavaScript sinks: assignments to `href`, `src`, `action`, `location`, and the other URL properties above; `location.assign` / `location.replace`; `window.open`; and `setAttribute` of a URL attribute

Leading whitespace and C0 controls are ignored. HTML character references (`&#58;`, `&colon;`, `&#106;avascript`) are decoded before the check, because that is what the browser does with an attribute.

A template expression that *is* the whole URL (`href="${url}"`) is not flagged: the value is not visible. A static `javascript:` prefix (`href="javascript:${code}"`) is flagged. A plain string that merely mentions the scheme, and is not written to a URL sink, is not flagged.

## Rule details

Examples of **incorrect** code:

```js
const view = html`<a href="javascript:void(0)">stay</a>`;
el.href = "javascript:alert(1)";
location.assign("javascript:alert(1)");
window.open(`javascript:${payload}`);
```

```html
<a href="javascript:alert(1)">x</a>
<a href="javascript&#58;alert(1)">x</a>
<svg><a xlink:href="javascript:alert(1)"></a></svg>
<meta http-equiv="refresh" content="0;url=javascript:alert(1)">
```

Examples of **correct** code:

```js
const view = html`<a href="https://example.com">docs</a>`;
el.href = "/home";
window.open("https://example.com");
const note = "javascript: is a scheme name";
```

## Options

`tags` works the same way as in [`csp/no-inline-handler`](./no-inline-handler.md).

## When not to use it

Don't enable it if you rely on `javascript:` URLs. They require `'unsafe-inline'` and are a common XSS sink.

## Further reading

- [MDN: javascript: URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript)
- Core ESLint's `no-script-url` flags JavaScript string literals only. It does not parse HTML or Lit templates.
