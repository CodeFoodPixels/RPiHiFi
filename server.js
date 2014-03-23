var net = require('net'),
    os = require('os'),
    fs = require('fs'),
    lame = require('lame'),
    Throttle = require('throttle'),
    ServiceDiscovery = require('node-discovery'),
    discovery = new ServiceDiscovery(),
    decoder = new lame.Decoder(),
    stream = fs.createReadStream('test.mp3').pipe(decoder),
    Writable = require('stream').Writable,
    Transform = require('stream').Transform,
    ws = new Writable(),
    pipeExport = new Transform(),
    interfaces = os.networkInterfaces(),
    newClients = [],
    throttledStream,
    dataserver,
    timeserver,
    throttle,
    exportedStream,
    discard;

ws._write = function (chunk, enc, next) {
    next();
};

pipeExport._transform = function (chunk, enc, next) {
    this.push(new Buffer('{"chunk": "'+chunk.toString('hex')+'", "time": '+((new Date()).getTime()+3000)+'}'));
    next();
}

for(name in interfaces) {
    var interface = interfaces[name];
    interface.forEach(function(entry) {
        if(entry.family === "IPv4" && entry.internal === false) {
            discovery.advertise({
                name: 'service.rpihifi.server',
                host: entry.address
            });
        }
    });
}

decoder.on("format", function(data){
    throttle = new Throttle((data.sampleRate*data.bitDepth*data.channels)/8);
    throttledStream = stream.pipe(throttle);
    exportedStream = throttledStream.pipe(pipeExport),
    discard = exportedStream.pipe(ws);
    dataserver = net.createServer(function(socket) {
        newClients.push(socket);
    });
    dataserver.listen(8080);
    setInterval(function(){
        addNewClients();
    }, 1000);
});

timeserver = net.createServer(function(socket) {
    socket.pipe(socket)
    socket.write(new Buffer('{"time":"'+(new Date()).getTime()+'"}'));
});
timeserver.listen(8081);

function addNewClients(){
    for (var i = newClients.length; i > 0; i--) {
        exportedStream.pipe(newClients[i-1]);
        newClients[i-1].on('error', function (exc) {
            console.log("ignoring exception: " + exc);
        });
        newClients.pop();
    }
}
