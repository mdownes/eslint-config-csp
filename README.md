# eslint-plugin-csp

An eslint shareable config to catch Content Security Policy violations.
It contains rules to stop common CSP violations like:
* Usage of setAttribute('style')
    * element.setAttribute('style',...)
* Usage of Implied evals 
    * setTimeout('doSomethingEvil()', 100);
* Usage of the eval keyword
    * const evilCode = eval("doSomethingEvil()")
* Usage of the new Function keyword:
    * new Function('function doSomethingEvil(){}');

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-config-csp`:

```sh
npm install eslint-config-csp --save-dev
```

## Usage

Add `eslint-config-csp` to the extends section of your `.eslintrc` configuration file.:

```js
{
 extends:['eslint-config-csp'],
}
```


