'use strict';

const DOCS_ROOT = 'https://github.com/mdownes/eslint-plugin-csp/blob/main/docs/rules';

/**
 * @param {string} ruleName
 * @returns {string}
 */
function docsUrl(ruleName) {
    return `${DOCS_ROOT}/${ruleName}.md`;
}

/**
 * @param {{name: string, description: string, schema?: object|Array<object>, messages: Record<string, string>, languages?: string[]}} spec
 */
function ruleMeta(spec) {
    return {
        type: 'problem',
        docs: {
            description: spec.description,
            recommended: true,
            url: docsUrl(spec.name),
        },
        schema: spec.schema || [],
        messages: spec.messages,
        languages: spec.languages || ['js/js'],
    };
}

const TAGS_SCHEMA = {
    type: 'array',
    items: { type: 'string' },
    uniqueItems: true,
    minItems: 1,
};

module.exports = {
    TAGS_SCHEMA,
    docsUrl,
    ruleMeta,
};
