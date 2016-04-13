var syntax = require('./syntax.js'),
    trees = [];

module.exports = function(tree,options){
  trees.push(tree);
  return '';
};

module.exports.before = function(options){
  return '';
};

module.exports.after = function(options){
  var ret = '',
      failures = 0,
      errors = 0,
      t = 0,
      tree;

  for(tree of trees){

    t += (tree.t1 - tree.t0) / 1000;

    if(!tree.error) ret += `  <testcase classname="" name="${tree.info.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" time="${(tree.t1 - tree.t0)/1000}" />${syntax.getNL(options.syntax)}`;
    else{
      if(tree.error.name == 'AssertionError'){
        failures++;
        ret += `  <testcase classname="" name="${tree.info.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" time="${(tree.t1 - tree.t0)/1000}">${syntax.getNL(options.syntax)}`;
        ret += `    <failure message="${tree.error.message.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${tree.error.stack.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</failure>${syntax.getNL(options.syntax)}`;
        ret += `  </testcase>${syntax.getNL(options.syntax)}`;
      }else{
        errors++;
        ret += `  <testcase classname="" name="${tree.info.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" time="${(tree.t1 - tree.t0)/1000}">${syntax.getNL(options.syntax)}`;
        ret += `    <error message="${tree.error.message.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${tree.error.stack.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</error>${syntax.getNL(options.syntax)}`
        ret += `  </testcase>${syntax.getNL(options.syntax)}`;
      }
    }

  }

  ret = `<testsuite errors="${errors}" failures="${failures}" name="u-test" skips="0" tests="${trees.length}" time="${t}">${syntax.getNL(options.syntax)}${ret}</testsuite>${syntax.getNL(options.syntax)}`;
  return ret;
};
