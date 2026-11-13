'use strict';

/**
 * Attribute names that start with "on" but are not event handlers.
 * `ononline` is a real window event, so it is intentionally not listed.
 */
const NOT_EVENT_HANDLERS = new Set(['on', 'one', 'once', 'only']);

/**
 * Inline event-handler content attributes (onclick, onload, onerror, ...).
 * HTML parsers lowercase the name before this runs.
 * @param {string} name
 * @returns {boolean}
 */
function isEventHandlerAttribute(name) {
    if (typeof name !== 'string') {
        return false;
    }

    const normalized = name.toLowerCase();
    if (NOT_EVENT_HANDLERS.has(normalized)) {
        return false;
    }

    return /^on[a-z]/.test(normalized);
}

module.exports = {
    isEventHandlerAttribute,
};
