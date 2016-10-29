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
    Hsm = require('hsm'),

    print = require('./main/print.js'),
    working = false,
    queue = [],
    code = 0;

module.exports = function(file,command){
  var server,br,hsm;

  command = command || process.env.TEST_BROWSER;

  if(working){
    queue.push([file,command]);
    return;
  }

  working = true;
  server = http.createServer();
  hsm = new Hsm(server);
  server.resolver = new Resolver();
  server.command = command;

  if(/^https?:\/\//.test(file)) server.url = file;
  else{
    br = browserify();
    br.transform(istanbulTF);
    br.add(file);
    server.br = br;
  }

  hsm.allowOrigin(/./);
  hsm.on('GET /',serveHTML);
  hsm.on('POST /result',printResult);
  hsm.on('GET /script.js',sendScript);

  server.once('listening',bindChild);
  server.listen(0);

  return server.resolver.yielded;
};

function bindChild(){
  this.resolver.accept(`http://127.0.0.1:${this.address().port}/result`);

  if(!this.command || this.command.match(/chrome/)) this.child = cp.spawn(this.command || 'google-chrome',[
    `--user-data-dir=${path.resolve(os.tmpdir(),rand.unique())}`,
    '--no-first-run',
    this.url || `http://127.0.0.1:${this.address().port}/`
  ]);

  else this.child = cp.spawn(this.command,[this.url || `http://127.0.0.1:${this.address().port}/`]);
  this.child.on('close',onceClosed);
}

function* serveHTML(e){
  yield e.take();
  e.response.setHeader('content-type','text/html;charset=utf-8');
  e.response.end(`
  <!DOCTYPE HTML>
  <html>
  <head>
  </head>
  <body>
  <script>__U_TEST_REMOTE__='http://127.0.0.1:${this.server.address().port}/result';</script>
  <script src="/script.js"></script>
  </body>
  </html>
  `);
}

function* printResult(e){
  var data;

  yield e.take();
  e.response.setHeader('content-type','text/plain');
  data = JSON.parse(yield e.request);

  if('error' in e.query){
    e.response.end();
    this.server.child.kill();
    throw data;
  }if('finish' in e.query){

    if(data) fs.writeFile(
      `./coverage/coverage-${rand.unique()}.json`,JSON.stringify(data),function(){}
    );

    working = false;
    setTimeout(killIt,200,this.server.child);
    this.server.close();
  }else if(typeof data == 'string') console.log(data);
  else{
    print(data);
    if(data.error) code = 1;
  }

  e.response.end();
}

function* sendScript(e){
  yield e.take();
  e.response.setHeader('content-type','application/javascript;charset=utf-8');
  if(this.server.br) this.server.br.bundle().pipe(e.response);
  else e.response.end();
}

function killIt(child){
  child.kill('SIGTERM');
}

function onceClosed(){
  if(queue.length) module.exports(...queue.shift());
}

process.on('beforeExit',function(){
  if(code) process.exit(code);
});
