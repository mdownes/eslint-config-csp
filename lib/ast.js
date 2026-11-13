'use strict';

const GLOBAL_OBJECTS = new Set([
    'window',
    'globalThis',
    'global',
    'self',
    'frames',
    'parent',
    'top',
]);

/**
 * @param {object|null|undefined} node
 * @returns {object|null|undefined}
 */
function unwrap(node) {
    let current = node;
    while (
        current
        && (
            current.type === 'TSAsExpression'
            || current.type === 'TSSatisfiesExpression'
            || current.type === 'TSNonNullExpression'
            || current.type === 'TSTypeAssertion'
            || current.type === 'ChainExpression'
            || current.type === 'ParenthesizedExpression'
        )
    ) {
        current = current.expression;
    }
    return current;
}

/**
 * @param {object} context
 * @returns {object}
 */
function getSourceCode(context) {
    return context.sourceCode || context.getSourceCode();
}

/**
 * @param {object} context
 * @param {object} identifier
 * @returns {boolean}
 */
function isShadowed(context, identifier) {
    if (!identifier || identifier.type !== 'Identifier') {
        return false;
    }

    try {
        const sourceCode = getSourceCode(context);
        if (typeof sourceCode.getScope !== 'function') {
            return false;
        }

        let scope = sourceCode.getScope(identifier);
        while (scope) {
            const variable = scope.set && scope.set.get(identifier.name);
            if (variable) {
                return variable.defs.length > 0;
            }
            scope = scope.upper;
        }
    } catch {
        // HTML SourceCode and parsers without scope analysis have nothing to shadow.
        return false;
    }

    return false;
}

/**
 * @param {object} context
 * @param {object} node
 * @param {string} name
 * @returns {boolean}
 */
function isGlobalReference(context, node, name) {
    const value = unwrap(node);
    if (!value || value.type !== 'Identifier' || value.name !== name) {
        return false;
    }
    return !isShadowed(context, value);
}

/**
 * @param {object} context
 * @param {object} node
 * @returns {boolean}
 */
function isGlobalObject(context, node) {
    const value = unwrap(node);
    if (!value || value.type !== 'Identifier' || !GLOBAL_OBJECTS.has(value.name)) {
        return false;
    }
    return !isShadowed(context, value);
}

/**
 * @param {object|null|undefined} node
 * @returns {string|null}
 */
function memberPropertyName(node) {
    const value = unwrap(node);
    if (!value || value.type !== 'MemberExpression') {
        return null;
    }

    if (!value.computed && value.property.type === 'Identifier') {
        return value.property.name;
    }

    if (value.computed && value.property.type === 'Literal' && typeof value.property.value === 'string') {
        return value.property.value;
    }

    if (
        value.computed
        && value.property.type === 'TemplateLiteral'
        && value.property.expressions.length === 0
    ) {
        return value.property.quasis[0].value.cooked;
    }

    return null;
}

/**
 * @param {object} node
 * @returns {string|null}
 */
function literalString(node) {
    const value = unwrap(node);
    if (!value) {
        return null;
    }
    if (value.type === 'Literal' && typeof value.value === 'string') {
        return value.value;
    }
    if (value.type === 'TemplateLiteral' && value.expressions.length === 0) {
        return value.quasis.map((quasi) => quasi.value.cooked || '').join('');
    }
    return null;
}

/**
 * True when the expression is definitely a string (literal, template, or
 * concatenation that includes a string). Identifiers are not included:
 * they might be functions, which setTimeout is allowed to receive.
 * @param {object|null|undefined} node
 * @returns {boolean}
 */
function isStringExpression(node) {
    const value = unwrap(node);
    if (!value) {
        return false;
    }

    if (value.type === 'Literal') {
        return typeof value.value === 'string';
    }

    if (value.type === 'TemplateLiteral') {
        return true;
    }

    if (value.type === 'BinaryExpression' && value.operator === '+') {
        return isStringExpression(value.left) || isStringExpression(value.right);
    }

    if (value.type === 'SequenceExpression') {
        return isStringExpression(value.expressions[value.expressions.length - 1]);
    }

    return false;
}

/**
 * @param {object} context
 * @param {number} start
 * @param {number} end
 * @param {string} messageId
 * @param {Record<string, string>} [data]
 */
function reportOffsets(context, start, end, messageId, data) {
    const sourceCode = getSourceCode(context);
    const text = sourceCode.getText();
    const length = text.length;
    const safeStart = Math.max(0, Math.min(start, length));
    let safeEnd = Math.max(0, Math.min(end, length));
    if (safeEnd <= safeStart) {
        safeEnd = Math.min(length, safeStart + 1);
    }

    context.report({
        loc: {
            start: sourceCode.getLocFromIndex(safeStart),
            end: sourceCode.getLocFromIndex(safeEnd),
        },
        messageId,
        data,
    });
}

/**
 * @param {object} context
 * @returns {string[]}
 */
function templateTags(context) {
    const fromOptions = context.options[0] && context.options[0].tags;
    if (Array.isArray(fromOptions) && fromOptions.length > 0) {
        return fromOptions;
    }

    const fromSettings = context.settings && context.settings.csp && context.settings.csp.tags;
    if (Array.isArray(fromSettings) && fromSettings.length > 0) {
        return fromSettings;
    }

    return ['html', 'svg'];
}

/**
 * @param {object|null|undefined} tag
 * @param {string[]} names
 * @returns {boolean}
 */
function isTemplateTag(tag, names) {
    const value = unwrap(tag);
    if (!value) {
        return false;
    }
    if (value.type === 'Identifier') {
        return names.includes(value.name);
    }
    return false;
}

/**
 * @param {object} context
 * @param {object} node
 * @returns {boolean}
 */
function isHtmlFile(node) {
    return Boolean(
        node
        && Array.isArray(node.body)
        && node.body.some((child) => child && child.type === 'Document'),
    );
}

/**
 * @param {object} node
 * @returns {{name: string, nameNode: object, valueNode: object|null}|null}
 */
function setAttributeCall(node) {
    if (!node || node.type !== 'CallExpression') {
        return null;
    }

    const property = memberPropertyName(node.callee);
    if (property !== 'setAttribute' && property !== 'setAttributeNS') {
        return null;
    }

    const nameIndex = property === 'setAttributeNS' ? 1 : 0;
    const nameNode = node.arguments[nameIndex];
    const name = literalString(nameNode);
    if (name == null) {
        return null;
    }

    return {
        name,
        nameNode,
        valueNode: node.arguments[nameIndex + 1] || null,
    };
}

module.exports = {
    getSourceCode,
    isGlobalObject,
    isGlobalReference,
    isHtmlFile,
    isShadowed,
    isStringExpression,
    isTemplateTag,
    literalString,
    memberPropertyName,
    reportOffsets,
    setAttributeCall,
    templateTags,
    unwrap,
};
