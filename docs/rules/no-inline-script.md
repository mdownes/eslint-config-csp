# csp/no-inline-script

Disallow `<script>` elements that have no `nonce` attribute. Strict CSP allows a script because its nonce matches `script-src 'nonce-...'`, not because the host is allow-listed. Inline scripts without a nonce need `'unsafe-inline'`, which a nonce-based policy ignores.

The check runs on Lit `html` / `svg` templates and on `.html` files.

## What is skipped

- A non-empty `nonce` attribute, including Lit `nonce=${serverNonce}`
- An empty `nonce` or `nonce=""` — it cannot match the header, so it is still reported
- Script types the browser does not execute: `application/json`, `*+json`, and `text/*` other than JavaScript. `type="module"`, `importmap`, and `speculationrules` are executed under CSP and still need a nonce
- `<script src="...">` when `allowExternal` is `true` (the default, used by `recommended`)

`strict` sets `allowExternal` to `false`. Under `'strict-dynamic'`, a parser-inserted `<script src>` still needs the nonce; a host allow-list alone does not execute it.

Hash-based allow-lists (`'sha256-...'`) are not detected. The rule looks for a nonce.

`<script>` text inside an `.html` file is not parsed as JavaScript, so `csp/no-eval` will not see `eval()` written there.

## Rule details

Examples of **incorrect** code for the default options:

```js
const view = html`<script>app()</script>`;
const view = html`<script type="module">import "./app.js";</script>`;
```

```html
<script>app()</script>
<script nonce>app()</script>
<script type="importmap">{}</script>
```

Examples of **incorrect** code when `allowExternal` is `false`:

```html
<script src="/app.js"></script>
```

Examples of **correct** code:

```js
const view = html`<script nonce=${nonce}>app()</script>`;
const view = html`<script src=${src}></script>`;
const view = html`<script type="application/json">${JSON.stringify(data)}</script>`;
```

```html
<script nonce="server-generated" src="/app.js"></script>
<script type="application/ld+json">{}</script>
```

## Options

```json
{
    "csp/no-inline-script": ["error", { "allowExternal": true, "tags": ["html", "svg"] }]
}
```

| Option | Default | What it does |
| --- | --- | --- |
| `allowExternal` | `true` | Allow `<script src>` without a nonce. `strict` sets this to `false`. |
| `tags` | `html`, `svg` | Template tags treated as HTML. `settings.csp.tags` is the shared fallback. |

## When not to use it

Don't enable it for HTML that is not served with a nonce-based `script-src`. A classic host allow-list does not require a nonce on external scripts; leave `allowExternal` on in that case, or disable the rule and keep the other CSP rules.

## Further reading

- [web.dev: strict CSP](https://web.dev/articles/strict-csp)
- [MDN: nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
