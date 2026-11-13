'use strict';

const parse5 = require('parse5');
const { isEventHandlerAttribute } = require('./event-handlers');
const { isJavascriptRefresh, isJavascriptUrl } = require('./javascript-url');

/**
 * Attributes whose values are URLs the browser may navigate or load.
 * `data-*` attributes are not included; only the exact `data` attribute
 * (used by <object>) is.
 */
const URL_ATTRIBUTES = new Set([
    'href',
    'src',
    'action',
    'formaction',
    'xlink:href',
    'data',
    'poster',
    'background',
    'cite',
    'srcset',
    'ping',
]);

const MAX_SRCDOC_DEPTH = 4;

/**
 * Script type values that the browser will not execute as script.
 * `module`, `importmap`, and `speculationrules` stay executable: CSP applies.
 * @param {string|undefined} typeValue
 * @returns {boolean}
 */
function isPassiveScriptType(typeValue) {
    if (!typeValue) {
        return false;
    }

    const type = typeValue.trim().toLowerCase();
    if (!type || type === 'module' || type === 'importmap' || type === 'speculationrules') {
        return false;
    }

    if (type.includes('javascript') || type.includes('ecmascript')) {
        return false;
    }

    if (type.startsWith('text/')) {
        return true;
    }

    return type === 'application/json' || type.endsWith('+json');
}

/**
 * @param {{name: string, prefix?: string}} attr
 * @returns {string}
 */
function qualifiedName(attr) {
    return attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
}

/**
 * @param {Array<{name: string, prefix?: string, value: string}>} attrs
 * @param {string} name
 * @returns {{name: string, prefix?: string, value: string}|undefined}
 */
function getAttr(attrs, name) {
    const wanted = name.toLowerCase();
    return attrs.find((attr) => qualifiedName(attr).toLowerCase() === wanted);
}

/**
 * A nonce attribute counts only when it has a value. An empty nonce cannot
 * match a nonce in the CSP header. Dynamic Lit values are stitched to a
 * non-empty placeholder, so nonce="${serverNonce}" is accepted.
 * @param {Array<{name: string, prefix?: string, value: string}>} attrs
 * @returns {boolean}
 */
function hasNonce(attrs) {
    const nonce = getAttr(attrs, 'nonce');
    return Boolean(nonce && nonce.value.trim().length > 0);
}

/**
 * @param {Array<{name: string, prefix?: string, value: string}>} attrs
 * @returns {boolean}
 */
function hasExternalSource(attrs) {
    const src = getAttr(attrs, 'src');
    return Boolean(src && src.value.trim().length > 0);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function styleValueHasJavascriptUrl(value) {
    return /url\s*\(\s*(['"])?\s*javascript:/i.test(value);
}

/**
 * @param {string} name
 * @param {string} value
 * @returns {boolean}
 */
function attributeHasJavascriptUrl(name, value) {
    if (name === 'srcset') {
        return value.split(',').some((candidate) => {
            const url = candidate.trim().split(/\s+/)[0];
            return isJavascriptUrl(url);
        });
    }

    if (name === 'ping') {
        return value.split(/[\s,]+/).some((url) => isJavascriptUrl(url));
    }

    if (name === 'style') {
        return styleValueHasJavascriptUrl(value);
    }

    if (!URL_ATTRIBUTES.has(name)) {
        return false;
    }

    return isJavascriptUrl(value);
}

/**
 * Shared markup checker used by Lit templates and by standalone HTML files.
 * Returns violations with half-open offsets into `html`.
 *
 * @param {string} html
 * @param {{allowExternalScripts?: boolean, depth?: number}} [options]
 * @returns {Array<{kind: string, messageId: string, data: Record<string, string>, start: number, end: number}>}
 */
function checkHtml(html, options = {}) {
    const allowExternalScripts = options.allowExternalScripts !== false;
    const depth = options.depth || 0;
    const violations = [];

    let fragment;
    try {
        fragment = parse5.parseFragment(html, { sourceCodeLocationInfo: true });
    } catch {
        // parse5 recovers from broken markup rather than throwing, but a
        // caller-supplied non-string should not take the whole lint down.
        return violations;
    }

    /**
     * @param {object} node
     */
    function walk(node) {
        if (node.tagName) {
            inspectElement(node);
        }

        const children = node.childNodes || [];
        for (const child of children) {
            walk(child);
        }

        // <template> contents live on `content`, not `childNodes`.
        if (node.content) {
            walk(node.content);
        }
    }

    /**
     * @param {object} node
     */
    function inspectElement(node) {
        const tag = String(node.tagName).toLowerCase();
        const attrs = node.attrs || [];
        const location = node.sourceCodeLocation || {};
        const attrLocations = location.attrs || {};

        for (const attr of attrs) {
            const name = qualifiedName(attr).toLowerCase();
            const attrLocation = attrLocations[name] || attrLocations[qualifiedName(attr)];
            if (!attrLocation) {
                continue;
            }

            const range = {
                start: attrLocation.startOffset,
                end: attrLocation.endOffset,
            };

            if (isEventHandlerAttribute(attr.name) || isEventHandlerAttribute(name)) {
                push(violations, {
                    kind: 'inline-handler',
                    messageId: 'handler',
                    data: { name: attr.name.toLowerCase() },
                    ...range,
                });
            }

            if (name === 'style') {
                push(violations, {
                    kind: 'inline-style-attribute',
                    messageId: 'attribute',
                    data: { tag },
                    ...range,
                });
            }

            if (attributeHasJavascriptUrl(name, attr.value)) {
                push(violations, {
                    kind: 'javascript-url',
                    messageId: 'url',
                    data: { name },
                    ...range,
                });
            }

            if (name === 'srcdoc' && attr.value && depth < MAX_SRCDOC_DEPTH) {
                const inner = checkHtml(attr.value, {
                    allowExternalScripts,
                    depth: depth + 1,
                });
                for (const violation of inner) {
                    push(violations, {
                        ...violation,
                        start: range.start,
                        end: range.end,
                    });
                }
            }
        }

        if (tag === 'meta') {
            const equiv = getAttr(attrs, 'http-equiv');
            const content = getAttr(attrs, 'content');
            const contentLocation = attrLocations.content;
            if (
                equiv
                && content
                && contentLocation
                && /^refresh$/i.test(equiv.value)
                && isJavascriptRefresh(content.value)
            ) {
                push(violations, {
                    kind: 'javascript-url',
                    messageId: 'url',
                    data: { name: 'content' },
                    start: contentLocation.startOffset,
                    end: contentLocation.endOffset,
                });
            }
        }

        const startTag = location.startTag || location;
        if (typeof startTag.startOffset !== 'number') {
            return;
        }

        const tagRange = {
            start: startTag.startOffset,
            end: startTag.endOffset,
        };

        if (tag === 'script') {
            const typeAttr = getAttr(attrs, 'type');
            if (isPassiveScriptType(typeAttr && typeAttr.value)) {
                return;
            }
            if (allowExternalScripts && hasExternalSource(attrs)) {
                return;
            }
            if (hasNonce(attrs)) {
                return;
            }
            push(violations, {
                kind: 'inline-script',
                messageId: 'missingNonce',
                data: { tag: 'script' },
                ...tagRange,
            });
        }

        if (tag === 'style' && !hasNonce(attrs)) {
            push(violations, {
                kind: 'inline-style-element',
                messageId: 'element',
                data: { tag: 'style' },
                ...tagRange,
            });
        }
    }

    walk(fragment);
    return violations;
}

/**
 * @param {Array<object>} violations
 * @param {object} violation
 */
function push(violations, violation) {
    const key = [
        violation.kind,
        violation.messageId,
        violation.start,
        violation.end,
        violation.data && violation.data.name,
        violation.data && violation.data.tag,
    ].join(':');

    if (violations.some((existing) => existing.key === key)) {
        return;
    }

    violations.push({ ...violation, key });
}

module.exports = {
    checkHtml,
};
