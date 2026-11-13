'use strict';

const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');
const plugin = require('..');

const root = path.join(__dirname, '..');

/**
 * @param {object|object[]} config
 * @param {string} code
 * @param {string} filePath
 */
async function lint(config, code, filePath) {
    const eslint = new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: Array.isArray(config) ? config : [config],
    });
    const results = await eslint.lintText(code, { filePath: path.join(root, filePath) });
    return results[0];
}

function ruleIds(result) {
    return result.messages.map((message) => message.ruleId);
}

describe('flat configs', () => {
    it('recommended flags eval and Lit handlers, and allows benign innerHTML', async () => {
        const result = await lint(
            plugin.configs.recommended,
            [
                'eval("alert(1)");',
                'el.innerHTML = "<b>hello</b>";',
                'const view = html`<button onclick="evil()"></button>`;',
            ].join('\n'),
            'src/app.js',
        );

        expect(result.errorCount).toBeGreaterThan(0);
        expect(ruleIds(result)).toEqual(expect.arrayContaining([
            'csp/no-eval',
            'csp/no-inline-handler',
        ]));
        expect(ruleIds(result)).not.toContain('csp/no-inner-html');
    });

    it('strict flags benign innerHTML strings', async () => {
        const result = await lint(
            plugin.configs.strict,
            'el.innerHTML = "<b>hello</b>";',
            'src/app.js',
        );

        expect(ruleIds(result)).toContain('csp/no-inner-html');
    });

    it('defineHtmlConfig language mode lints .html files', async () => {
        const result = await lint(
            plugin.defineHtmlConfig(),
            '<button onclick="evil()">x</button><script src="app.js"></script><script>bad()</script>',
            'src/index.html',
        );

        expect(result.messages.filter((message) => message.fatal)).toEqual([]);
        expect(ruleIds(result)).toContain('csp/no-inline-handler');
        expect(ruleIds(result)).toContain('csp/no-inline-script');
        expect(ruleIds(result).filter((id) => id === 'csp/no-inline-script')).toHaveLength(1);
    });

    it('defineHtmlConfig parser mode lints .html files without the language plugin key', async () => {
        const result = await lint(
            plugin.defineHtmlConfig({ mode: 'parser' }),
            '<a href="javascript:alert(1)">x</a>',
            'src/index.html',
        );

        expect(ruleIds(result)).toEqual(['csp/no-javascript-url']);
    });

    it('strict HTML config requires a nonce on external scripts', async () => {
        const result = await lint(
            plugin.defineHtmlConfig({ strict: true }),
            '<script src="app.js"></script>',
            'src/index.html',
        );

        expect(ruleIds(result)).toEqual(['csp/no-inline-script']);
    });

    it('recommended and HTML config can be composed', async () => {
        const htmlResult = await lint(
            [plugin.configs.recommended, plugin.defineHtmlConfig()],
            '<div style="color: red"></div>',
            'src/index.html',
        );
        const jsResult = await lint(
            [plugin.configs.recommended, plugin.defineHtmlConfig()],
            'new Function("return 1");',
            'src/app.js',
        );

        expect(ruleIds(htmlResult)).toEqual(['csp/no-inline-style']);
        expect(ruleIds(jsResult)).toEqual(['csp/no-new-func']);
    });

    it('legacy configs keep the eslintrc shape', () => {
        expect(plugin.configs['legacy-recommended'].plugins).toEqual(['csp']);
        expect(plugin.configs['legacy-strict'].rules['csp/no-inline-script']).toEqual([
            'error',
            { allowExternal: false },
        ]);
        expect(plugin.configs['legacy-strict'].rules['csp/no-inner-html']).toEqual([
            'error',
            { allowBenignLiterals: false },
        ]);
    });

    it('every rule documents itself and points meta.docs.url at that file', () => {
        for (const [name, rule] of Object.entries(plugin.rules)) {
            const url = rule.meta.docs.url;
            expect(url).toBe(`https://github.com/mdownes/eslint-plugin-csp/blob/main/docs/rules/${name}.md`);
            const docsPath = path.join(root, 'docs', 'rules', `${name}.md`);
            expect(fs.existsSync(docsPath)).toBe(true);
            const body = fs.readFileSync(docsPath, 'utf8');
            expect(body).toContain(`# csp/${name}`);
            expect(rule.meta.docs.description.length).toBeGreaterThan(10);
            expect(rule.meta.messages).toBeTruthy();
        }
    });
});
