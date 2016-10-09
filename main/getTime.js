var process = global.process,
    performance = global.performance;

module.exports = function(){
  var now;

  if(process){
    now = process.hrtime();
    return now[0] * 1e3 + now[1] * 1e-6;
  }

  if(performance) return performance.now();

  return Date.now();
};
