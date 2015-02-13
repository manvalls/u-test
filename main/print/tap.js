var syntax = require('./syntax.js'),
    seq;

module.exports = function(tree,options){
  var msg;
  
  if(tree.error) msg = 'not ok ' + ++seq;
  else msg = 'ok ' + ++seq;
  msg += ' - ' + tree.info + syntax.getNL(options.syntax);
  
  return msg;
};

module.exports.before = function(options){
  seq = 0;
  return 'TAP version 13' + syntax.getNL(options.syntax);
};

module.exports.after = function(options){
  return '1..' + seq + syntax.getNL(options.syntax);
};

