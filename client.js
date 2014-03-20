var net = require('net'),
    speakerLib = require('speaker'),
    speaker = new speakerLib(),
    startTime = 0,
    beforeStart = 0,
    Transform = require('stream').Transform,
    stream = new Transform(),
    client = net.connect({port: 8080, host: "127.0.0.1"}, function() {
});

stream._transform = function (chunk, enc, next) {
    this.push(chunk)
    next();
}

// client.pipe(speaker);
var i = 0;
client.on('data', function(data){
    var obj = JSON.parse(data.toString('utf8'));
    // console.log(obj.time);
    if (startTime === 0) {
        startTime = obj.time;
        beforeStart = startTime - (new Date()).getTime();
        setTimeout(function(){
            stream.pipe(speaker)
        }, beforeStart);
    }
    console.log(new Buffer(obj.chunk, 'hex'));
    stream.push(new Buffer(obj.chunk, 'hex'));
})
