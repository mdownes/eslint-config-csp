# csp/no-new-func

Disallow the `Function` constructor. `new Function("...")` and `Function("...")` compile a string into a function, which CSP treats as `eval()`.

## Rule details

Examples of **incorrect** code:

```js
const fn = new Function("a", "return a + 1");
const other = Function("return 1");
const builtIn = new window.Function("return 1");
```

Examples of **correct** code:

```js
function add(a) {
    return a + 1;
}

const addOne = (a) => a + 1;
```

A local binding named `Function` is not the built-in constructor and is ignored. `obj.Function(...)` is also ignored.

## Options

This rule has no options.

## When not to use it

Don't enable it in code that intentionally builds functions from strings under `'unsafe-eval'`.

## Further reading

- [MDN: `Function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
