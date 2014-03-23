var net = require('net'),
    speakerLib = require('speaker'),
    Transform = require('stream').Transform,
    ServiceDiscovery = require('node-discovery'),
    discovery = new ServiceDiscovery(),
    speaker = new speakerLib(),
    startTime = 0,
    beforeStart = 0,
    stream = new Transform(),
    streamBuffer = "",
    splitStart = -1,
    splitEnd = -1,
    timemodifier = 0,
    latency = 0,
    dataclient,
    timeclient;

discovery.setup('service.rpihifi.server', function(service, callback){
    timeclient = net.connect({port: 8081, host: service.host}, function() {
        timeclient.write(new Buffer('{"pingtime":"'+(new Date()).getTime()+'"}'));
    });
    timeclient.on('data', function(data){
        var timeData = [data.toString('utf8')];
        if (data.toString('utf8').match("}{")) {
            timeData = data.toString('utf8').match(/\{[^\}]+?\}/g);
        }
        for (var i = 0, len = timeData.length; i<len; i++) {
            var servertime = JSON.parse(timeData[i].toString('utf8'));
            if (servertime.pingtime){
                latency = Math.ceil(((new Date()).getTime() - servertime.pingtime)/2);
            } else {
                timemodifier = parseInt(servertime.time, 10) - (new Date()).getTime();
            }
        }
    })
    dataclient = net.connect({port: 8080, host: service.host}, function() {
    });
    dataclient.on('close', function(){
        startTime = 0;
        stream = new Transform();
        streamBuffer = "";
    })
    dataclient.on('data', function(data){
        streamBuffer += data.toString('utf8');
        splitStart = streamBuffer.indexOf('{');
        splitEnd = streamBuffer.indexOf('}');
        splitEnd = (splitStart > splitEnd) ? streamBuffer.indexOf('}', (splitEnd+1)):splitEnd;
        if (splitStart !== -1 && splitEnd !== -1) {
            var string = streamBuffer.slice(splitStart, (splitEnd+1)),
                obj = JSON.parse(string);

            streamBuffer = streamBuffer.slice((splitEnd+1));

            if (startTime === 0) {
                startTime = obj.time;
                beforeStart = (startTime - (new Date()).getTime() - timemodifier) - latency;
                setTimeout(function(){
                    stream.pipe(speaker)
                }, beforeStart);
            }
            stream.push(new Buffer(obj.chunk, 'hex'));
        }
    })
    callback();
});

stream._transform = function (chunk, enc, next) {
    this.push(chunk)
    next();
}
