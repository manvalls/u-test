exports.getNL = function(syntax){
  switch(syntax){
    case 'html': return '<br>';
    default: return '\n';
  }
}

exports.red = function(txt,syntax){
  switch(syntax){
    case 'md': return txt;
    case 'html': return '<span style="color: red;">' + txt + '</span>';
    default: return '\x1B[31m' + txt + '\x1B[39m';
  }
}

exports.green = function(txt,syntax){
  switch(syntax){
    case 'md': return txt;
    case 'html': return '<span style="color: green;">' + txt + '</span>';
    default: return '\x1B[32m' + txt + '\x1B[39m';
  }
}
