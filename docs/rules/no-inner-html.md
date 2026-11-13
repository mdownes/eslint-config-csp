# csp/no-inner-html

Disallow HTML sinks that a strict Content Security Policy will refuse, or that throw once Trusted Types (`require-trusted-types-for 'script'`) is turned on.

The sink's HTML string is parsed with the same checker used for Lit templates and `.html` files.

## Which calls are flagged

| Sink | `<script>` in the string | Handlers, `javascript:` URLs, inline styles |
| --- | --- | --- |
| `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `createContextualFragment`, `unsafeHTML` | Not reported. Browsers do not run those scripts. | Reported. Handlers and styles are applied and CSP blocks them. |
| `document.write`, `document.writeln`, `srcdoc` | Reported. These parse a document, so the script runs and needs a nonce. | Reported. |

`recommended` allows a static string that contains none of those patterns (`"<b>hello</b>"`, `""`). `strict` sets `allowBenignLiterals` to `false` and reports every raw value, because Trusted Types rejects it.

Dynamic values (`el.innerHTML = input`, `` el.innerHTML = `<b>${name}</b>` ``) are reported. The static pieces are still parsed, so `` el.innerHTML = `<div onclick="${fn}">` `` is reported as unsafe markup rather than as merely dynamic.

`policy.createHTML(...)` and `trustedTypes.emptyHTML` are allowed. They are the Trusted Types escape hatch.

## Rule details

Examples of **incorrect** code under `recommended`:

```js
el.innerHTML = '<img onerror="alert(1)">';
el.innerHTML = '<div style="color: red"></div>';
el.insertAdjacentHTML("beforeend", '<button onclick="x"></button>');
el.innerHTML = userHtml;
unsafeHTML('<img onerror=alert(1)>');
document.write("<script>alert(1)</script>");
frame.srcdoc = "<script>alert(1)</script>";
```

Examples of **correct** code under `recommended`:

```js
el.textContent = userText;
el.innerHTML = "<b>hello</b>";
el.innerHTML = policy.createHTML(userHtml);
el.innerHTML = trustedTypes.emptyHTML;
```

`"<b>hello</b>"` is incorrect under `strict`.

## Options

```json
{
    "csp/no-inner-html": ["error", {
        "allowBenignLiterals": true,
        "flagDynamic": true,
        "allowCallees": []
    }]
}
```

| Option | Default | What it does |
| --- | --- | --- |
| `allowBenignLiterals` | `true` | Allow static HTML that the shared checker accepts. `strict` sets this to `false`. |
| `flagDynamic` | `true` | Report values the rule cannot fully see. |
| `allowCallees` | `[]` | Names of functions whose return value is trusted. `createHTML` is always allowed and does not need to be listed. Matching is by the callee's name (`sanitize`), so keep the list tight. |

## When not to use it

Don't enable `strict` (or `allowBenignLiterals: false`) unless the deployment actually enforces Trusted Types. The `recommended` default is the CSP behavior: only markup that CSP will block.

`@microsoft/eslint-plugin-sdl` and `eslint-plugin-no-unsanitized` ban these sinks outright and understand sanitizer wrappers. Keep them if you want that policy. This rule is the CSP-shaped version: it reuses the HTML checker and it knows about `createHTML`.

## Further reading

- [MDN: `Element.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations)
- [MDN: Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [web.dev: Trusted Types](https://web.dev/articles/trusted-types)
