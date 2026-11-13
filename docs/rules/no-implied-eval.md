# csp/no-implied-eval

Disallow string arguments to `setTimeout`, `setInterval`, `setImmediate`, and `execScript`. Browsers evaluate those strings the same way they evaluate `eval()`, so a CSP without `'unsafe-eval'` blocks them.

## Rule details

Examples of **incorrect** code:

```js
setTimeout("track()", 0);
window.setInterval(`tick(${id})`, 1000);
setTimeout("on" + event, 0);
execScript("legacy()");
```

Examples of **correct** code:

```js
setTimeout(() => track(), 0);
window.setInterval(tick, 1000);
```

A bare `setTimeout(...)` that refers to a local function is ignored. Member calls such as `window.setTimeout("code")` are always reported. An identifier passed as the callback (`setTimeout(fn, 0)`) is allowed, because it is not a string.

`setImmediate` and `execScript` are included because they are the same implied-eval shape ESLint's core rule covers. Node's `setImmediate` does not evaluate strings; the call is still reported so browser polyfills are not missed.

## Options

This rule has no options.

## When not to use it

Don't enable it if the application deliberately depends on `'unsafe-eval'`.

## Further reading

- [MDN: `setTimeout` with a string](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#delay)
- [MDN: CSP `unsafe-eval`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe-eval)
