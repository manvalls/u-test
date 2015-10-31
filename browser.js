var browserify = require('browserify'),
    istanbulTF = require('browserify-istanbul'),
    babelify = require('babelify'),
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

  br.transform(babelify.configure({
    blacklist: ['strict'],
    nonStandard: false
  }),{global: true});

  br.add(file);

  server.on('request',function(req,res){
    var data,collector;

    switch(req.url){
      case '/':
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
        res.write(bcore);
        br.bundle().pipe(res);
        break;
      case '/result':
        data = JSON.parse(req.headers['u-test-data']);

        if(data == 0){
          working = false;
          child.kill();
          server.close();
        }else if(data instanceof Array){
          fs.writeFile( `./coverage/coverage-${Math.random().toString(10).slice(2)}.json`,
                        JSON.stringify(data[1]),function(){});
          print(data[0]);
        }

        res.end();
        break;
    }

  });

};

function onceClosed(){
  if(queue.length) module.exports(queue.shift());
}
