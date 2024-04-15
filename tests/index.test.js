const fs = require('fs');
const ESLint = require('eslint').ESLint;

async function getErrors(fileToTest) {
    const eslint = new ESLint({
        overrideConfigFile: 'index.js',
    });
    const fileContent = fs.readFileSync(fileToTest, 'utf8');
    const results = await eslint.lintText(fileContent, { filePath: fileToTest });
    return results[0];
}


describe('Validate ESLint configs', () => {

    it(`load config 'index.js' in ESLint to validate all rules are correct`, () => {
        return getErrors('./tests/testSource.js').then((result) => {

            expect(result.messages[0].ruleId).toEqual('no-restricted-syntax');
            expect(result.messages[0].severity).toEqual(2);
            expect(result.messages[0].message).toEqual("You must not use setAttribute('style') to set styles. Use element.style instead.");

            expect(result.messages[1].ruleId).toEqual('no-eval');
            expect(result.messages[1].severity).toEqual(2);
            expect(result.messages[1].message).toEqual("eval can be harmful.");

            expect(result.messages[2].ruleId).toEqual('no-new-func');
            expect(result.messages[2].severity).toEqual(2);
            expect(result.messages[2].message).toEqual("The Function constructor is eval.");

            expect(result.messages[3].ruleId).toEqual('no-implied-eval');
            expect(result.messages[3].severity).toEqual(2);
            expect(result.messages[3].message).toEqual("Implied eval. Consider passing a function instead of a string.");



        });
    });

});