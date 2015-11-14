#! /usr/bin/env node
var coveralls = require.resolve('coveralls/bin/coveralls'),
    istanbul = require.resolve('istanbul/lib/cli'),
    browser = require.resolve('./bin/browser-runner.js'),

    walk = require('y-walk'),
    Resolver = require('y-resolver'),

    cp = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    exitCode = 0,
    testDir;

function exec(command,opt){
  var res = new Resolver(),
      child = cp.exec(command,opt || {},function(err){
        if(err) res.reject(err);
        else res.accept();
      });

  child.stdout.pipe(process.stdout);
  return res.yielded;
}

testDir = walk.wrap(function*(files,folder){
  var file,p;

  for(file of files){
    p = path.resolve(folder,file);
    if(fs.statSync(p).isDirectory()) yield testDir(fs.readdirSync(p),p);
    else{

      if(file.match(/\.nd.*\.js$/))
      try{ yield exec(`"${istanbul}" cover "${p}" --report none --print none --include-pid`); }
      catch(e){ exitCode = 1; }

      if(file.match(/\.br.*\.js$/))
      try{ yield exec(`"${browser}" "${p}"`); }
      catch(e){ exitCode = 1; }

    }
  }

});

function rmDir(files,folder){
  var file,p;

  for(file of files){
    p = path.resolve(folder,file);
    if(fs.statSync(p).isDirectory()) rmDir(fs.readdirSync(p),p);
    else fs.unlinkSync(p);
  }

  fs.rmdirSync(folder);
}

walk(function*(){
  try{ rmDir(fs.readdirSync('./coverage'),'./coverage'); }catch(e){}
  yield testDir(fs.readdirSync('./test/'),'./test/');
  yield exec(`"${istanbul}" report --root ./coverage/ text-summary lcov --color`);

  if(process.env.COVERALLS_REPO_TOKEN) yield exec(`"${coveralls}"`,{
    input: cp.readFileSync('./coverage/lcov.info')
  });

  if(process.argv.indexOf('--keep') == -1) rmDir(fs.readdirSync('./coverage'),'./coverage');
});
