# eslint-plugin-csp

ESLint rules for the patterns a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) refuses to run.

A strict policy is roughly:

```http
Content-Security-Policy:
  script-src 'nonce-{random}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  style-src 'nonce-{random}';
```

That policy blocks `eval`, `new Function`, `setTimeout("...")`, inline `on*` handlers, `javascript:` URLs, `<script>` and `<style>` without a nonce, and `style=""` attributes. Teams that also send `require-trusted-types-for 'script'` make `innerHTML = someString` throw. This plugin flags those patterns while you type, including inside Lit `html` templates and standalone `.html` files.

`recommended` is the CSP behavior. `strict` additionally requires a nonce on `<script src>` (what `'strict-dynamic'` requires of parser-inserted scripts) and rejects every raw HTML-sink assignment (what Trusted Types does).

Version 2.0.0 replaces [`eslint-config-csp`](https://www.npmjs.com/package/eslint-config-csp) 1.x. The old package was a shareable config that turned on three core ESLint rules plus a `no-restricted-syntax` selector. This is a plugin with its own rules, so the version moved to 2.0.0 rather than restarting at 1.0.0. See [MIGRATION.md](./MIGRATION.md).

## What it catches

| Rule | Recommended | Strict |
| --- | --- | --- |
| [`csp/no-eval`](./docs/rules/no-eval.md) | error | error |
| [`csp/no-implied-eval`](./docs/rules/no-implied-eval.md) | error | error |
| [`csp/no-new-func`](./docs/rules/no-new-func.md) | error | error |
| [`csp/no-set-attribute-style`](./docs/rules/no-set-attribute-style.md) | error | error |
| [`csp/no-inline-handler`](./docs/rules/no-inline-handler.md) | error | error |
| [`csp/no-javascript-url`](./docs/rules/no-javascript-url.md) | error | error |
| [`csp/no-inline-script`](./docs/rules/no-inline-script.md) | error, `<script src>` allowed | error, nonce required on `<script src>` too |
| [`csp/no-inline-style`](./docs/rules/no-inline-style.md) | error | error |
| [`csp/no-inner-html`](./docs/rules/no-inner-html.md) | error, benign literal HTML allowed | error, any raw HTML string |

Markup rules (`no-inline-handler`, `no-javascript-url`, `no-inline-script`, `no-inline-style`) share one checker, `lib/html/check.js`. Lit templates are stitched back into HTML and passed through it. `.html` files are passed through the same function. A violation found in a template is the same violation found in a file.

## Install

```sh
npm install eslint-plugin-csp --save-dev
```

Peer dependency: ESLint 8.57, 9, or 10. ESLint 10 needs Node.js `^20.19`, `^22.13`, or `>=24`. ESLint 9 runs on Node.js `>=18.18`.

Linting `.html` files needs an optional peer. JavaScript-only setups should not install it.

```sh
npm install @html-eslint/eslint-plugin @html-eslint/parser --save-dev
```

## JavaScript and TypeScript

```js
// eslint.config.js
import csp from "eslint-plugin-csp";

export default [
    csp.configs.recommended,
];
```

CommonJS:

```js
const csp = require("eslint-plugin-csp");

module.exports = [
    csp.configs.recommended,
];
```

`recommended` and `strict` apply to `**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}`. TypeScript files still need a TypeScript parser. Put `typescript-eslint` in the same array; this plugin does not set a parser, so it will not overwrite yours:

```js
import csp from "eslint-plugin-csp";
import tseslint from "typescript-eslint";

export default [
    ...tseslint.configs.recommended,
    csp.configs.strict,
];
```

To limit the rules to one directory, copy `rules` instead of using the preset object (the preset carries its own `files` list):

```js
import csp from "eslint-plugin-csp";

export default [
    {
        files: ["src/**/*.{js,ts}"],
        plugins: { csp },
        rules: csp.configs.recommended.rules,
    },
];
```

## Lit

Nothing extra to turn on. `html` and `svg` tagged templates in any file the preset already lints are checked:

```js
import { html, svg } from "lit";

html`<button @click=${onClick}>OK</button>`;       // ok, Lit listener
html`<button onclick=${onClick}>OK</button>`;      // reported
svg`<svg onload="init()"></svg>`;                  // reported
```

Other tag names are ignored. Point the rules at them with `settings` (every markup rule) or with a rule option:

```js
{
    settings: {
        csp: { tags: ["html", "svg", "innerHtml"] },
    },
}
```

JSX `onClick` is not an HTML attribute. This plugin does not try to lint React.

## HTML files

Both of the setups below run the same checker.

### ESLint 9 and 10: `language: "html/html"`

`defineHtmlConfig()` registers `@html-eslint/eslint-plugin` and sets the language. It throws a useful error if the optional peer is missing.

```js
import csp from "eslint-plugin-csp";

export default [
    csp.configs.recommended,
    csp.defineHtmlConfig(),
    // or: csp.defineHtmlConfig({ strict: true })
];
```

If you already configure `@html-eslint`, do not call `defineHtmlConfig()` (ESLint will refuse to redefine the `html` plugin). Add the rules to the block you have:

```js
import html from "@html-eslint/eslint-plugin";
import csp from "eslint-plugin-csp";

export default [
    csp.configs.recommended,
    {
        files: ["**/*.html"],
        plugins: { html, csp },
        language: "html/html",
        rules: {
            "csp/no-inline-handler": "error",
            "csp/no-javascript-url": "error",
            "csp/no-inline-script": "error",
            "csp/no-inline-style": "error",
        },
    },
];
```

### Parser only, including ESLint 8 flat config

`language` does not exist on ESLint 8. Install `@html-eslint/parser` and select parser mode:

```js
const csp = require("eslint-plugin-csp");

module.exports = [
    csp.configs.recommended,
    csp.defineHtmlConfig({ mode: "parser" }),
];
```

Which is the same as:

```js
import htmlParser from "@html-eslint/parser";
import csp from "eslint-plugin-csp";

export default [
    {
        files: ["**/*.html"],
        plugins: { csp },
        languageOptions: { parser: htmlParser },
        rules: {
            "csp/no-inline-handler": "error",
            "csp/no-javascript-url": "error",
            "csp/no-inline-script": "error",
            "csp/no-inline-style": "error",
        },
    },
];
```

JavaScript inside a `<script>` block of an `.html` file is not parsed as JavaScript. `csp/no-eval` will not see it. Extract that script, or lint the `.js` module it came from.

### ESLint 8 eslintrc

Flat config is the supported path. If you are still on eslintrc, the legacy presets only carry rules:

```js
module.exports = {
    extends: ["plugin:csp/legacy-recommended"],
    overrides: [
        {
            files: ["*.html"],
            parser: "@html-eslint/parser",
            rules: {
                "csp/no-inline-handler": "error",
                "csp/no-javascript-url": "error",
                "csp/no-inline-script": "error",
                "csp/no-inline-style": "error",
            },
        },
    ],
};
```

ESLint 10 removed eslintrc. Use the flat presets there.

## How this relates to the other security plugins

Use those plugins for what they are good at. Add this one for the CSP surface they do not model.

| Concern | eslint-plugin-security | @microsoft/eslint-plugin-sdl | eslint-plugin-no-unsanitized | eslint-plugin-csp |
| --- | --- | --- | --- | --- |
| Node sinks (child process, `fs`, regex, timing) | yes | some | no | no |
| `eval` / `new Function` / string timers | `detect-eval-with-expression` only | no | no | yes, with a CSP message |
| `innerHTML` and `document.write` | no | bans the sinks | bans them unless a sanitizer is in the allow-list | parses the string; `recommended` allows markup CSP will not block; allows `createHTML()` |
| Inline `on*` handlers in HTML or Lit | no | no | no | yes |
| `javascript:` URLs in markup | no (core `no-script-url` is JS text only) | no | no | yes |
| `<script>` / `<style>` nonce, `style=""` | no | no | no | yes |
| `.html` files | no | no | no | yes, optional parser |

Core ESLint has `no-eval`, `no-implied-eval`, `no-new-func`, and `no-script-url`, but they are not in `eslint:recommended`. Enabling `eslint:all` next to this plugin reports the same JavaScript calls twice. The copies here exist so the diagnostic talks about CSP, and so the HTML half of the check has a rule to live on. Core rules do not look inside a Lit template or an `.html` file.

## Limits

- Hash allow-lists (`'sha256-...'`) are not recognized. Nonce rules look for a `nonce` attribute with a value.
- `element.style.color = "red"` is not flagged. `style-src-attr` blocks it in Chromium too; flagging every CSSOM write is too noisy. `cssText` and `setAttribute("style")` are flagged. Prefer a class or a constructable stylesheet.
- `href="${url}"` is not flagged, because the URL is not in the source. `href="javascript:${code}"` is.
- JSX is out of scope.
- Handlebars and similar syntax in `.html` files is parsed as HTML. It works when the extra tokens sit where text is legal, and it can false-positive when they do not.

## Migrating from eslint-config-csp

[MIGRATION.md](./MIGRATION.md) has the config change and the maintainer commands for publishing the new package, deprecating `eslint-config-csp`, and renaming the GitHub repo.
