'use strict';

const { ruleMeta, TAGS_SCHEMA } = require('../meta');
const { checkHtml } = require('../html/check');
const { stitchTemplate } = require('../html/stitch');
const { isHtmlFile, isTemplateTag, reportOffsets, templateTags } = require('../ast');

/**
 * Build a rule that reports one class of markup violation.
 * Lit `html` / `svg` templates and standalone HTML files both go through
 * `checkHtml`, so the two surfaces cannot drift apart.
 *
 * @param {object} spec
 * @param {string} spec.name
 * @param {string} spec.description
 * @param {string[]} spec.kinds
 * @param {Record<string, string>} spec.messages
 * @param {string[]} [spec.languages]
 * @param {Record<string, object>} [spec.extraProperties]
 * @param {object} [spec.defaults]
 * @param {function} [spec.checkerOptions]
 * @param {function} [spec.extraVisitors]
 */
function createHtmlRule(spec) {
    const properties = {
        tags: TAGS_SCHEMA,
        ...(spec.extraProperties || {}),
    };

    return {
        meta: ruleMeta({
            name: spec.name,
            description: spec.description,
            languages: spec.languages || ['js/js', 'html/html'],
            schema: [{
                type: 'object',
                properties,
                additionalProperties: false,
            }],
            messages: spec.messages,
        }),
        create(context) {
            const options = { ...(spec.defaults || {}), ...(context.options[0] || {}) };
            const tags = templateTags(context);
            const checkerOptions = spec.checkerOptions ? spec.checkerOptions(options) : {};

            /**
             * @param {string} html
             * @param {function(number, number): ([number, number]|null)} locate
             */
            function emit(html, locate) {
                const violations = checkHtml(html, checkerOptions);
                for (const violation of violations) {
                    if (!spec.kinds.includes(violation.kind)) {
                        continue;
                    }

                    const range = locate(violation.start, violation.end);
                    if (!range) {
                        continue;
                    }

                    reportOffsets(context, range[0], range[1], violation.messageId, violation.data);
                }
            }

            const visitors = {
                Program(node) {
                    if (!isHtmlFile(node)) {
                        return;
                    }

                    const html = (context.sourceCode || context.getSourceCode()).getText();
                    emit(html, (start, end) => [start, end]);
                },
                TaggedTemplateExpression(node) {
                    if (!isTemplateTag(node.tag, tags) || !node.quasi) {
                        return;
                    }

                    const stitched = stitchTemplate(node.quasi);
                    emit(stitched.html, stitched.locate);
                },
            };

            if (spec.extraVisitors) {
                Object.assign(visitors, spec.extraVisitors(context, options));
            }

            return visitors;
        },
    };
}

module.exports = {
    createHtmlRule,
};
