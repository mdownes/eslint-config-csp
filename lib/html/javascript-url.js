'use strict';

/**
 * Browsers ignore leading C0 controls and ASCII whitespace in a URL.
 * @param {string} value
 * @returns {string}
 */
function trimLeadingControls(value) {
    let index = 0;
    while (index < value.length && value.charCodeAt(index) <= 0x20) {
        index += 1;
    }
    return value.slice(index);
}

/**
 * True when a URL string uses the javascript: scheme.
 * Leading ASCII whitespace and C0 controls are ignored, matching browser
 * URL trimming. Callers that parse HTML should pass the decoded attribute
 * value (parse5 already resolves entities such as &#58; and &colon;).
 * @param {string} value
 * @returns {boolean}
 */
function isJavascriptUrl(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const trimmed = trimLeadingControls(value);
    return /^javascript:/i.test(trimmed);
}

/**
 * True when a meta refresh content value navigates to a javascript: URL.
 * @param {string} value
 * @returns {boolean}
 */
function isJavascriptRefresh(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const match = /url\s*=\s*(['"]?)([^'";\s]+)\1/i.exec(value);
    if (!match) {
        return false;
    }

    return isJavascriptUrl(match[2]);
}

module.exports = {
    isJavascriptUrl,
    isJavascriptRefresh,
};
