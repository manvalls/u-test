var browserify = require('browserify'),
    istanbulTF = require('browserify-istanbul'),
    babelify = require('babelify'),
    babelOpts = {plugins: [
      require("babel-plugin-transform-es2015-template-literals"),
      require("babel-plugin-transform-es2015-literals"),
      require("babel-plugin-transform-es2015-function-name"),
      require("babel-plugin-transform-es2015-arrow-functions"),
      require("babel-plugin-transform-es2015-block-scoped-functions"),
      require("babel-plugin-transform-es2015-classes"),
      require("babel-plugin-transform-es2015-object-super"),
      require("babel-plugin-transform-es2015-shorthand-properties"),
      require("babel-plugin-transform-es2015-computed-properties"),
      require("babel-plugin-transform-es2015-for-of"),
      require("babel-plugin-transform-es2015-sticky-regex"),
      require("babel-plugin-transform-es2015-unicode-regex"),
      require("babel-plugin-transform-es2015-constants"),
      require("babel-plugin-transform-es2015-spread"),
      require("babel-plugin-transform-es2015-parameters"),
      require("babel-plugin-transform-es2015-destructuring"),
      require("babel-plugin-transform-es2015-block-scoping"),
      require("babel-plugin-transform-es2015-typeof-symbol"),
      [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }]
    ]},
    http = require('http'),
    cp = require('child_process'),
    fs = require('fs'),

    bcore = fs.readFileSync(require.resolve('babel-polyfill/dist/polyfill.js')),
    print = require('./main/print.js'),
    working = false,
    queue = [];

module.exports = function(file,command){
  var br = browserify(),
      server = http.createServer(),
      child;

  if(working){
    queue.push(file);
    return;
  }

  working = true;

  br.transform(istanbulTF);
  server.listen(0,function(){
    child = cp.spawn(command || 'firefox',[`http://127.0.0.1:${server.address().port}/`]);
    child.on('close',onceClosed);
  });

  br.transform(babelify.configure(babelOpts),{global: true});
  br.add(file);

  server.on('request',function(req,res){
    var data,collector;

    switch(req.url){
      case '/':
        res.setHeader('content-type','text/html;charset=utf-8');
        res.end(`
        <!DOCTYPE HTML>
        <html>
        <head>
        </head>
        <body>
        <script>__U_TEST_REMOTE__='http://127.0.0.1:${server.address().port}/result';</script>
        <script src="/script.js"></script>
        </body>
        </html>
        `);
        break;
      case '/script.js':
        res.setHeader('content-type','application/javascript;charset=utf-8');
        res.write(bcore);
        br.bundle().pipe(res);
        break;
      case '/result':
        data = JSON.parse(req.headers['u-test-data']);

        if(data == 0){
          working = false;
          child.kill('SIGTERM');
          server.close();
        }else if(data instanceof Array){
          fs.writeFile( `./coverage/coverage-${Math.random().toString(10).slice(2)}.json`,
                        JSON.stringify(data[1]),function(){});
          print(data[0]);
        }

        res.setHeader('content-type','text/plain');
        res.end();
        break;
    }

  });

};

function onceClosed(){
  if(queue.length) module.exports(queue.shift());
}
