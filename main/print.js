var _default = require('./print/default.js'),
    tap = require('./print/tap.js'),

    process = global.process,
    trees = [],

    endTO,options,container,subcontainer,test;

if(process){
  options = {
    showErrors: process.env.showErrors == 'true' || process.env.e == '',
    showDetails: process.env.showDetails == 'true' || process.env.d == '',
    showCompleted: process.env.showCompleted == 'true' || process.env.c == '',
    showTime: process.env.showTime == 'true' || process.env.t == '',
    syntax: process.env.syntax || process.env.s || 'console',
    indicator: process.env.indicator || process.env.i || 'tick'
  };

  if(process.env.tap == '') process.stdout.write(tap.before(options));
  else process.stdout.write(_default.before(options));
}else (function(){
  var errorsButton,
      detailsButton,
      timeButton,
      completedButton;

  console.log(navigator.userAgent + '\n');
  console.log(tap.before({syntax: 'console'}).replace(/\n$/,''));

  options = {
    showErrors: false,
    showDetails: false,
    showCompleted: false,
    syntax: 'html',
    indicator: 'tick'
  };

  container = document.createElement('div');
  subcontainer = document.createElement('div');

  subcontainer.style.whiteSpace = 'pre';
  subcontainer.style.fontFamily = 'monospace';

  container.appendChild(subcontainer);
  container.appendChild(document.createElement('br'));

  errorsButton = document.createElement('input');
  errorsButton.type = 'checkbox';
  errorsButton.onclick = function(){
    options.showErrors = this.checked;
    showHTML();
  };

  container.appendChild(errorsButton);
  container.appendChild(document.createTextNode('Errors'));
  container.appendChild(document.createElement('br'));

  detailsButton = document.createElement('input');
  detailsButton.type = 'checkbox';
  detailsButton.onclick = function(){
    options.showDetails = this.checked;
    showHTML();
  };

  container.appendChild(detailsButton);
  container.appendChild(document.createTextNode('Details'));
  container.appendChild(document.createElement('br'));

  timeButton = document.createElement('input');
  timeButton.type = 'checkbox';
  timeButton.onclick = function(){
    options.showTime = this.checked;
    showHTML();
  };

  container.appendChild(timeButton);
  container.appendChild(document.createTextNode('Elapsed time'));
  container.appendChild(document.createElement('br'));

  completedButton = document.createElement('input');
  completedButton.type = 'checkbox';
  completedButton.onclick = function(){
    options.showCompleted = this.checked;
    showHTML();
  };

  container.appendChild(completedButton);
  container.appendChild(document.createTextNode('Number of completed tests'));
  container.appendChild(document.createElement('br'));

  document.body.appendChild(container);
})();

function showHTML(){
  subcontainer.innerHTML = _default.before(options);

  for(i = 0;i < trees.length;i++){
    subcontainer.innerHTML += _default(trees[i],options);
  }

  subcontainer.innerHTML += _default.after(options);
}


function checkEnd(){
  if(!test.running){
    if(process){
      if(process.env.tap == '') process.stdout.write(tap.after(options));
      else process.stdout.write(_default.after(options));
    }else{
      console.log(tap.after({syntax: 'console'}).replace(/\n$/,'') + '\n');
    }
  }
}

module.exports = function(tree){
  var i;

  clearTimeout(endTO);
  endTO = setTimeout(checkEnd);

  if(process){
    if(process.env.tap == '') process.stdout.write(tap(tree,options));
    else process.stdout.write(_default(tree,options));
  }else{
    console.log(tap(tree,{syntax: 'console'}).replace(/\n$/,''));
    trees.push(tree);
    showHTML();
  }
};

module.exports.check = function(){
  checkEnd();
};

test = require('../main.js');
