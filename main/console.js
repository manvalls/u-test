var test = require('../main.js'),
    assert = require('assert'),
    util = require('util'),
    getTime = require('./getTime'),
    times = new Map();

exports.error =
exports.warn =
exports.debug =
exports.info =
exports.log = function(){
  test.log(util.format(...arguments));
};

exports.dir = function(obj, opt){
  opt = opt || {};
  opt.customInspect = false;
  test.log(util.inspect(obj,opt));
};

exports.trace = function(){
  var e = new Error(),
      stack = e.stack || '';

  if(e.message) stack = stack.replace(e.name + ': ' + e.message,'');
  else stack = stack.replace(e.name + '\n','');
  stack = stack.replace(/\n\s*/g,'\n  ').replace(/.*\n*/,'');

  if(arguments.length) stack = 'Trace: ' + util.format(...arguments) + '\n' + stack;
  else stack = 'Trace\n' + stack;

  test.log(stack);
};

exports.assert = function(condition,...args){
  if(args.length) assert(condition,util.format(...args));
  else assert(condition);
};

exports.time = function(label){
  times.set(label,getTime());
};

exports.timeEnd = function(label){
  var t0 = times.get(label);

  if(t0) test.log(`${label}: ${(getTime() - t0).toFixed(3)}ms`);
  times.delete(label);
};
