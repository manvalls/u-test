var browserify = require('browserify'),
    istanbulTF = require('browserify-istanbul'),
    Yielded = require('y-resolver').Yielded,
    rand = require('u-rand'),
    http = require('http'),
    cp = require('child_process'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),

    print = require('./main/print.js'),
    working = false,
    queue = [];

module.exports = function(file,command){
  var br = browserify(),
      server = http.createServer();

  if(working){
    queue.push(file);
    return;
  }

  working = true;
  br.transform(istanbulTF);
  br.add(file);

  server.br = br;
  server.command = command;
  server.on('request',onRequest);
  server.once('listening',bindChild);
  server.listen(0);
};

function bindChild(){

  if(!this.command) this.child = cp.spawn('google-chrome',[
    `--user-data-dir=${path.resolve(os.tmpDir(),rand.unique())}`,
    '--no-first-run',
    `http://127.0.0.1:${this.address().port}/`
  ]);

  else this.child = cp.spawn(this.command,[`http://127.0.0.1:${this.address().port}/`]);
  this.child.on('close',onceClosed);
}

function onRequest(req,res){
  
  switch(req.url){
    case '/':
      res.setHeader('content-type','text/html;charset=utf-8');
      res.end(`
      <!DOCTYPE HTML>
      <html>
      <head>
      </head>
      <body>
      <script>__U_TEST_REMOTE__='http://127.0.0.1:${this.address().port}/result';</script>
      <script src="/script.js"></script>
      </body>
      </html>
      `);
      break;
    case '/script.js':
      res.setHeader('content-type','application/javascript;charset=utf-8');
      this.br.bundle().pipe(res);
      break;
    case '/result':

      Yielded.get(req).then(data => {
        data = JSON.parse(data);

        if(data == 0){
          working = false;
          this.child.kill('SIGTERM');
          this.close();
        }else if(data instanceof Array){
          fs.writeFile( `./coverage/coverage-${rand.unique()}.json`,
                        JSON.stringify(data[1]),function(){});
          print(data[0]);
        }else if(typeof data == 'string') console.log(data);

        res.setHeader('content-type','text/plain');
        res.end();
      });

      break;
  }

}

function onceClosed(){
  if(queue.length) module.exports(queue.shift());
}
