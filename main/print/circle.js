var junit = require('./junit.js'),
    rand = require('u-rand'),
    _default = require('./default.js'),
    trees = [];

module.exports = function(tree,options){
  junit(tree,options);
  return _default(tree,options);
};

module.exports.before = function(options){
  junit.before(options);
  return _default.before(options);
};

module.exports.after = function(options){
  var fs = require('fs');

  try{ fs.mkdirSync(process.env.CIRCLE_TEST_REPORTS + '/u-test'); }
  catch(e){ }

  fs.writeFileSync(
    process.env.CIRCLE_TEST_REPORTS + '/u-test/' + rand.unique() + '.xml',
    junit.after(options)
  );

  return _default.after(options);
};
