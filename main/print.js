var _default = require('./print/default.js'),
    tap = require('./print/tap.js'),
    junit = require('./print/junit.js'),

    process = global.process,
    console = global.console,
    trees = [],

    endTO,options,container,
    subcontainer,test,printer,old;

if(process){
  options = {
    showErrors: process.env.showErrors == 'true' || process.env.e == '',
    showDetails: process.env.showDetails == 'true' || process.env.d == '',
    showCompleted: process.env.showCompleted == 'true' || process.env.c == '',
    showTime: process.env.showTime == 'true' || process.env.t == '',
    syntax: process.env.syntax || process.env.s || 'console',
    indicator: process.env.indicator || process.env.i || 'tick'
  };

  if(process.env.CIRCLE_TEST_REPORTS) printer = require('./print/circle.js');
  else if(process.env.tap == '') printer = tap;
  else if(process.env.junit == '') printer = junit;
  else printer = _default;

  process.stdout.write(printer.before(options));

  process.on('exit',function(){
    process.stdout.write(printer.after(options));
  });

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
  var i;
  subcontainer.innerHTML = _default.before(options);

  for(i = 0;i < trees.length;i++){
    subcontainer.innerHTML += _default(trees[i],options);
  }

  subcontainer.innerHTML += _default.after(options);
}


function checkEnd(){
  if(!(process || test.running)) console.log(tap.after({syntax: 'console'}).replace(/\n$/,'') + '\n');
}

module.exports = function(tree){
  var i;

  clearTimeout(endTO);
  endTO = setTimeout(checkEnd);

  if(process) process.stdout.write(printer(tree,options));
  else{
    console.log(tap(tree,{syntax: 'console'}).replace(/\n$/,''));
    trees.push(tree);
    showHTML();
  }
};

module.exports.check = function(){
  checkEnd();
};

test = require('../main.js');
