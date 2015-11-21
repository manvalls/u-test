var walk = require('y-walk'),
    Resolver = require('y-resolver'),
    Emitter = require('y-emitter'),

    print,
    process = global.process,
    performance = global.performance,
    code = 0,
    pending = [],
    test;

global.__U_TEST_REMAINING__ = 0;

// Node

function Node(info){
  Emitter.Hybrid.call(this);

  this.info = info;

  Object.defineProperty(this,'parent',{
    writable: true,
    enumerable: false,
    configurable: false
  });

  this.children = [];
  this.parent = null;

  this.pending = 0;
  this.errored = 0;
  this.error = null;

  this.t = null;
  this.t0 = null;
  this.t1 = null;
}

Node.prototype = Object.create(Emitter.Hybrid.prototype);

Node.prototype.setParent = function(parent){
  parent.children.push(this);
  this.parent = parent;
}

Node.prototype.resolve = function(error){
  if(!error) return;
  if(this.error) return;

  code = 1;
  this.error = error;

  if(this.parent){
    this.parent.errored++;
    this.parent.resolve(error);
  }
}

Node.prototype.toString = function(){
  return this.info;
}

function getTime(){
  var now;

  if(process){
    now = process.hrtime();
    return now[0] * 1e3 + now[1] * 1e-6;
  }

  if(performance) return performance.now();

  return Date.now();
}

Node.prototype.start = function(){
  this.t0 = getTime();

  if(this.is('started')) return;
  this.set('started');
  this.set('done');

  if(this.parent){
    this.parent.unset('done');
    this.parent.pending++;
  }

  pending.push(this);
};

Node.prototype.end = function(){
  var i;

  if(this.is('finished')) return;
  this.set('finished');

  this.t1 = getTime();
  this.t = this.t1 - this.t0;

  i = pending.indexOf(this);
  pending.splice(i,1);

  if(this.parent){
    if(--this.parent.pending == 0) this.parent.set('done');
  }

};


module.exports = test = walk.wrap(function*(info,generator,args,thisArg){
  var node = new Node(info),
      ret,error,stack,i,xhr;

  stack = walk.getStack();
  for(i = stack.length - 1;i >= 0;i--) if(stack[i] instanceof Node){
    node.setParent(stack[i]);
    break;
  }

  if(!node.parent) __U_TEST_REMAINING__++;
  node.start();

  try{ ret = yield walk.trace(node,generator,args || [],thisArg || this); }
  catch(e){ error = e; }

  yield node.until('done');

  node.resolve(error);
  node.end();

  if(!node.parent){
    if(global.__U_TEST_REMOTE__ && global.XMLHttpRequest){
      xhr = new XMLHttpRequest();
      xhr.onload = notifyRemote;
      xhr.open('POST',__U_TEST_REMOTE__,true);
      xhr.setRequestHeader('Content-Type','application/json');
      xhr.send(JSON.stringify([node,__coverage__]));
    }

    print(node);
  }

  return ret;
});

test.log = function(str){
  str = '# ' + str.replace(/\n/g,'\n# ');
  console.log(str);
  if(global.__U_TEST_REMOTE__ && global.XMLHttpRequest){
    xhr = new XMLHttpRequest();
    xhr.open('POST',__U_TEST_REMOTE__,true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.send(JSON.stringify(str));
  }
};

Object.defineProperty(Error.prototype,'toJSON',{
  value: function(){
    return {
      message: this.message,
      name: this.name,
      stack: this.stack
    };
  },
  configurable: true,
  writable: true
});

function notifyRemote(){
  __U_TEST_REMAINING__--;
  xhr = new XMLHttpRequest();
  xhr.open('POST',__U_TEST_REMOTE__,true);
  xhr.setRequestHeader('Content-Type','application/json');
  xhr.send(__U_TEST_REMAINING__ + '');
}

print = require('./main/print.js');

Object.defineProperty(test,'running',{get: function(){
  return pending.length > 0;
}});

if(process) process.on('beforeExit',function(){
  var i,p;

  function endMe(ev,d){
    this.resolve('Unfinished test');
    this.end();
  }

  if(pending.length > 0){
    p = pending.slice();
    for(i = 0;i < p.length;i++) p[i].once('done',endMe);
    print.check();
  }

  process.exit(code);
});
