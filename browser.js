var browserify = require('browserify'),
    istanbulTF = require('browserify-istanbul'),
    Resolver = require('y-resolver'),
    Yielded = Resolver.Yielded,
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
  var server,br;

  if(working){
    queue.push([file,command]);
    return;
  }

  working = true;
  server = http.createServer();
  server.resolver = new Resolver();

  if(/^https?:\/\//.test(file)/) server.url = file;
  else{
    br = browserify();
    br.transform(istanbulTF);
    br.add(file);
    server.br = br;
  }

  server.command = command;
  server.on('request',onRequest);
  server.once('listening',bindChild);
  server.listen(0);

  return server.resolver;
};

function bindChild(){
  this.resolver.accept(`http://127.0.0.1:${this.address().port}/result`);

  if(!this.command) this.child = cp.spawn('google-chrome',[
    `--user-data-dir=${path.resolve(os.tmpDir(),rand.unique())}`,
    '--no-first-run',
    this.url || `http://127.0.0.1:${this.address().port}/`
  ]);

  else this.child = cp.spawn(this.command,[this.url || `http://127.0.0.1:${this.address().port}/`]);
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
      if(this.br) this.br.bundle().pipe(res);
      else res.end();
      break;
    case '/result':
      res.setHeader('content-type','text/plain');
      res.setHeader('access-control-allow-origin','*');
      Yielded.get(req).listen(handleResult,[this,res]);
      break;
  }

}

function handleResult(server,res){
  var data;

  if(this.rejected) return;
  data = JSON.parse(this.value);

  if(data == 0){
    working = false;
    setTimeout(killIt,200,server.child);
    server.close();
  }else if(data instanceof Array){
    if(data[1]) fs.writeFile(
      `./coverage/coverage-${rand.unique()}.json`,JSON.stringify(data[1]),function(){}
    );

    print(data[0]);
  }else if(typeof data == 'string') console.log(data);

  res.end();
}

function killIt(child){
  child.kill('SIGTERM');
}

function onceClosed(){
  if(queue.length) module.exports(...queue.shift());
}
