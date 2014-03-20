var net = require('net'),
    speakerLib = require('speaker'),
    speaker = new speakerLib(),
    startTime = 0,
    beforeStart = 0,
    Transform = require('stream').Transform,
    stream = new Transform(),
    streamBuffer = "",
    splitPos = -1;
    client = net.connect({port: 8080, host: "127.0.0.1"}, function() {
});

stream._transform = function (chunk, enc, next) {
    this.push(chunk)
    next();
}

// client.pipe(speaker);
var i = 0;
client.on('data', function(data){
    streamBuffer += data.toString('utf8');
    splitPos = streamBuffer.indexOf('}');
    if (splitPos !== -1) {
        var string = streamBuffer.slice(0, (splitPos+1)),
            obj = JSON.parse(string);

        streamBuffer = streamBuffer.slice((splitPos+1));

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
    }
})
