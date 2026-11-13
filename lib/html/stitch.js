'use strict';

/**
 * Placeholder dropped between the static pieces of a tagged template.
 * It is a valid HTML attribute value and text node, and it does not look
 * like a javascript: URL or an event-handler name.
 */
const PLACEHOLDER = 'cspExpr';

/**
 * Join a template literal the way Lit will parse it, and remember how to
 * map offsets in that string back to offsets in the original source.
 *
 * Espree and typescript-eslint both include the surrounding backtick / `${`
 * / `}` characters in a template element's range, so the raw text starts
 * one character in.
 * @param {import('estree').TemplateLiteral} template
 * @returns {{html: string, locate: function(number, number): ([number, number]|null)}}
 */
function stitchTemplate(template) {
    const segments = [];
    let html = '';

    template.quasis.forEach((quasi, index) => {
        const raw = quasi.value.raw;
        const cooked = quasi.value.cooked == null ? raw : quasi.value.cooked;
        const sourceStart = quasi.range ? quasi.range[0] + 1 : null;

        segments.push({
            htmlStart: html.length,
            htmlEnd: html.length + cooked.length,
            sourceStart,
            precise: sourceStart != null && cooked.length === raw.length,
            rawLength: raw.length,
        });

        html += cooked;
        if (index < template.quasis.length - 1) {
            html += PLACEHOLDER;
        }
    });

    /**
     * @param {number} offset
     * @returns {typeof segments[number]|null}
     */
    function segmentAt(offset) {
        for (const segment of segments) {
            if (offset >= segment.htmlStart && offset < segment.htmlEnd) {
                return segment;
            }
        }
        return null;
    }

    /**
     * Map a half-open range in the stitched HTML onto the original source.
     * Returns null when the range starts inside a substituted expression.
     * @param {number} start
     * @param {number} end
     * @returns {[number, number]|null}
     */
    function locate(start, end) {
        const segment = segmentAt(start);
        if (!segment || segment.sourceStart == null) {
            return null;
        }

        const mappedStart = segment.precise
            ? segment.sourceStart + (start - segment.htmlStart)
            : segment.sourceStart;

        let mappedEnd = null;
        const endSegment = end > start ? segmentAt(end - 1) : segment;
        if (endSegment && endSegment.sourceStart != null) {
            mappedEnd = endSegment.precise
                ? endSegment.sourceStart + (end - 1 - endSegment.htmlStart) + 1
                : endSegment.sourceStart + endSegment.rawLength;
        }

        if (mappedEnd == null || mappedEnd <= mappedStart) {
            mappedEnd = segment.sourceStart + (segment.precise
                ? Math.max(1, segment.rawLength)
                : segment.rawLength);
        }

        if (mappedEnd <= mappedStart) {
            mappedEnd = mappedStart + 1;
        }

        return [mappedStart, mappedEnd];
    }

    return { html, locate };
}

module.exports = {
    PLACEHOLDER,
    stitchTemplate,
};
