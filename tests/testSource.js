document.setAttribute('style', 'color:blue');
const t = eval('doSomething()');
t();
const fn = new Function('doSomething');
fn();

setTimeout("someFunction()", 100);