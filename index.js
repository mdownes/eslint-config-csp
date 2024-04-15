module.exports = {
    rules: {
        'no-eval': 'error',
        'no-new-func': 'error',
        'no-implied-eval': 'error',
        "no-restricted-syntax": [
            "error",
            {
                "selector": "CallExpression[callee.property.name='setAttribute'][arguments.0.value='style']",
                "message": "You must not use setAttribute('style') to set styles. Use element.style instead."
            }
        ]
    }
};