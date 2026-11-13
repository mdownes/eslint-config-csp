# csp/no-eval

Disallow `eval()`. A Content Security Policy that does not include `'unsafe-eval'` in `script-src` refuses to run it, including indirect calls such as `(0, eval)`.

## Rule details

Examples of **incorrect** code:

```js
eval(userInput);
window.eval(userInput);
globalThis["eval"](userInput);
(0, eval)(userInput);
```

Examples of **correct** code:

```js
const run = actions[name];
if (typeof run === "function") {
    run();
}
```

A local binding named `eval` is ignored, because it is not the built-in CSP blocks. In strict mode (including ES modules) that binding is a syntax error anyway.

## Options

This rule has no options.

## When not to use it

Don't enable it in code that intentionally evaluates strings and ships `'unsafe-eval'`. That policy is incompatible with a strict CSP.

## Further reading

- [MDN: `eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)
- [MDN: CSP `script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
