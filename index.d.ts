export interface CspHtmlConfigOptions {
    /**
     * `"language"` selects `language: "html/html"` (ESLint 9 and 10).
     * `"parser"` sets `@html-eslint/parser` and also works on ESLint 8.
     */
    mode?: 'language' | 'parser';
    /** Require a nonce on `<script src>` as well as inline scripts. */
    strict?: boolean;
    files?: string[];
}

export interface CspSettings {
    csp?: {
        /** Tagged-template tags treated as HTML. Defaults to `html` and `svg`. */
        tags?: string[];
    };
}

interface CspPlugin {
    meta: {
        name: string;
        version: string;
    };
    rules: Record<string, unknown>;
    configs: {
        recommended: Record<string, unknown>;
        strict: Record<string, unknown>;
        'legacy-recommended': Record<string, unknown>;
        'legacy-strict': Record<string, unknown>;
    };
    defineHtmlConfig(options?: CspHtmlConfigOptions): Record<string, unknown>;
}

declare const plugin: CspPlugin;

export = plugin;
