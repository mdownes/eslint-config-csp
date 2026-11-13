# Migrating from eslint-config-csp 1.x

`eslint-plugin-csp` 2.0.0 replaces `eslint-config-csp` 1.x. The npm name changed, and the public API changed, so this is 2.0.0 of the CSP lint package rather than a new 1.0.0 that hides the break.

1.x was a shareable config. It enabled core `no-eval`, `no-implied-eval`, and `no-new-func`, and it banned `setAttribute("style")` with `no-restricted-syntax`. 2.0.0 is a plugin. Those checks are rules with CSP diagnostics, and the plugin adds the HTML and Lit checks the config never had.

## Config

Before, eslintrc:

```js
module.exports = {
    extends: ["eslint-config-csp"],
};
```

Before, flat config:

```js
import cspConfig from "eslint-config-csp";

export default [
    cspConfig,
];
```

After:

```js
import csp from "eslint-plugin-csp";

export default [
    csp.configs.recommended,
];
```

## Rule ids

| eslint-config-csp 1.x | eslint-plugin-csp 2.x |
| --- | --- |
| `no-eval` (core) | `csp/no-eval` |
| `no-implied-eval` (core) | `csp/no-implied-eval` |
| `no-new-func` (core) | `csp/no-new-func` |
| `no-restricted-syntax` on `setAttribute("style")` | `csp/no-set-attribute-style` |

`csp/no-set-attribute-style` also reports `style.cssText = "..."`. The 1.x message said to use `element.style` instead. That API is blocked by `style-src-attr` as well. Use a class or a constructable stylesheet.

If you also enable ESLint's core `no-eval`, `no-implied-eval`, `no-new-func`, or `no-script-url` (they ship in `eslint:all`, not in `eslint:recommended`), the same JavaScript call is reported twice. Keep the `csp/` rule if you want the CSP text and the Lit/HTML coverage. Core rules do not see either of those.

`recommended` allows `<script src>` without a nonce and allows an `innerHTML` string that contains no inline handler, `javascript:` URL, or inline style. `strict` does not. See the rule docs for the options.

## Publishing (maintainer only)

Do not run these from a checkout of 2.0.0 if the `name` in `package.json` is already `eslint-plugin-csp`. The 1.x publish has to come from the old package.

### 1. Publish eslint-plugin-csp

From the release commit of this tree, after the GitHub repo has been renamed (step 3) or from a checkout whose `repository.url` you accept as-is:

```sh
npm whoami
npm publish --access public
```

`files` in `package.json` is the publish set. `npm pack --dry-run` shows it before you publish. This repository's automation does not publish.

### 2. Publish a final eslint-config-csp and deprecate it

The last 1.x commit is `0db53d2` (`Updated documentation to eslint show flat config usage`), which is `eslint-config-csp@1.0.1`. Publish `1.0.2` from that commit, not from this branch.

```sh
git worktree add ../eslint-config-csp-1.0.2 0db53d2
cd ../eslint-config-csp-1.0.2
```

Bump `package.json` to `1.0.2`. Replace the README with a short notice that the package is unmaintained and that `eslint-plugin-csp` replaces it. Keep the 1.x config behavior so existing installs do not break when they pick up the patch. Then:

```sh
npm publish --access public
```

Deprecate every published version, including `1.0.2`, so installers see the warning:

```sh
npm deprecate eslint-config-csp@"*" "eslint-config-csp is deprecated and will not receive updates. Install eslint-plugin-csp instead: npm install eslint-plugin-csp --save-dev. https://www.npmjs.com/package/eslint-plugin-csp"
```

`npm deprecate` only changes the registry warning. It does not unpublish. Leave the 1.x tarball in place so lockfiles keep resolving.

Confirm:

```sh
npm view eslint-config-csp@1.0.2 deprecated
npm view eslint-plugin-csp version
```

### 3. Rename the GitHub repository

GitHub redirects the old URL, including issues and git remotes.

```sh
gh repo rename eslint-plugin-csp --repo mdownes/eslint-config-csp --yes
```

`https://github.com/mdownes/eslint-config-csp` then redirects to `https://github.com/mdownes/eslint-plugin-csp`. Rule docs and `package.json` already use the new URL. Rename before or immediately after `npm publish` so the homepage is not a 404. The redirect covers either order.
