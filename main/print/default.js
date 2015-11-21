var syntax = require('./syntax.js');

function getOk(options){
  return syntax.green('✓',options.syntax);
}

function getNok(options){
  return syntax.red('✗',options.syntax);
}

function getTime(node,options){
  if(options.showTime) return ' (' + node.t.toFixed(2) + 'ms' +')';
  return '';
}

function getCompleted(node,options){
  var ok = 0,i;

  if(!options.showCompleted) return '';
  if(!node.children.length) return '';
  if(!node.error) return '[' + node.children.length + '/' + node.children.length + '] ';

  for(i = 0;i < node.children.length;i++) if(!node.children[i].error) ok++;
  return '[' + ok + '/' + node.children.length + '] ';
}

function get(node,offset,options){
  var txt = offset,
      stack,i;

  offset = '  ' + offset;
  txt += getCompleted(node,options) + node.info;

  if(!node.error){
    txt += ' ' + getOk(options) + getTime(node,options) + syntax.getNL(options.syntax);
    if(options.showDetails) for(i = 0;i < node.children.length;i++) txt += get(node.children[i],offset,options);
  }else{
    txt += ' ' + getNok(options) + syntax.getNL(options.syntax);

    if(!node.errored){
      if(options.showErrors){
        stack = node.error.stack;

        if(stack){
          if(node.error.message){
            stack = stack.replace(node.error.name + ': ' + node.error.message,'');
            stack = node.error.name + ': ' + node.error.message + stack.replace(/\n\s*/g,'\n  ');
          }else{
            stack = stack.replace(node.error.name + '\n','');
            stack = node.error.name + '\n  ' + stack.replace(/\n\s*/g,'\n  ');
          }

          stack = stack.replace(/\s*$/,'');
          txt += offset + stack.replace(/\n/g,syntax.getNL(options.syntax) + offset) + syntax.getNL(options.syntax);
        }else txt += offset + (node.error+'').replace(/\n/g,syntax.getNL(options.syntax) + offset) + syntax.getNL(options.syntax);

      }
    }else for(i = 0;i < node.children.length;i++) txt += get(node.children[i],offset,options);
  }

  return txt;
}

module.exports = function(tree,options){
  options = options || {};

  return get(tree,'',options);
};

module.exports.before = module.exports.after = function(){ return ''; }
