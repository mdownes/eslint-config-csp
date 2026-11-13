# csp/no-inline-handler

Disallow inline `on*` event-handler attributes (`onclick`, `onload`, `onerror`, and the rest). A CSP without `'unsafe-inline'` refuses to compile them.

The same check runs in three places, through one HTML checker:

- Lit `html` and `svg` tagged templates in JavaScript or TypeScript
- Standalone `.html` files (see the HTML setup in the README)
- `setAttribute` / `setAttributeNS` calls that install the same attribute from JavaScript

Lit's `@click` listener syntax is not an HTML event-handler attribute and is allowed. So is `addEventListener`.

Attributes that merely start with `on` but are not handlers — `on`, `one`, `once`, and `only` — are ignored. `ononline` is a real event and is reported. Custom attributes such as `onboarding` are reported too; rename them or disable the rule for that line.

## Rule details

Examples of **incorrect** code:

```js
const view = html`<button onclick="evil()">Run</button>`;
const view = html`<button onclick=${handler}></button>`;
const icon = svg`<svg onload="evil()"></svg>`;
el.setAttribute("onclick", "evil()");
```

```html
<button onclick="evil()">Run</button>
<template><img onerror="evil()"></template>
<iframe srcdoc="<button onclick='evil()'></button>"></iframe>
```

Examples of **correct** code:

```js
const view = html`<button type="button" @click=${handler}>Run</button>`;
el.addEventListener("click", handler);
```

```html
<button type="button">Run</button>
<!-- <button onclick="evil()"></button> -->
```

The tag names treated as HTML templates default to `html` and `svg`. Override them with the `tags` option or with `settings.csp.tags`. A template tagged with any other name is ignored.

## Options

```json
{
    "csp/no-inline-handler": ["error", { "tags": ["html", "svg"] }]
}
```

`settings.csp.tags` applies to every markup rule when the option is omitted.

## When not to use it

Don't enable it if `script-src` (or `script-src-attr`) allows `'unsafe-inline'`. That choice gives up the main XSS protection of a strict CSP.

## Further reading

- [MDN: inline event handlers and CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe-inline)
- [Lit: event listeners](https://lit.dev/docs/templates/expressions/#event-listeners)
