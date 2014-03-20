var net = require('net'),
    fs = require('fs')
    lame = require('lame'),
    Throttle = require('throttle'),
    throttle = "",
    decoder = new lame.Decoder(),
    stream = fs.createReadStream('test.mp3').pipe(decoder),
    server = "",
    throttledStream = "",
    newClients = [],
    Writable = require('stream').Writable,
    Transform = require('stream').Transform,
    ws = new Writable(),
    pipeExport = new Transform(),
    exportedStream = "",
    discard = "";

ws._write = function (chunk, enc, next) {
    next();
};

pipeExport._transform = function (chunk, enc, next) {
    this.push(new Buffer('{"chunk": "'+chunk.toString('hex')+'", "time": '+((new Date()).getTime()+3000)+'}'));
    next();
}

decoder.on("format", function(data){
    throttle = new Throttle((data.sampleRate*data.bitDepth*data.channels)/8);
    throttledStream = stream.pipe(throttle);
    exportedStream = throttledStream.pipe(pipeExport),
    discard = exportedStream.pipe(ws);
    server = net.createServer(function(socket) {
            socket.pipe(socket);
            newClients.push(socket);
        });
    server.listen(8080);
    setInterval(function(){
        addNewClients();
    }, 1000);
})

function addNewClients(){
    for (var i = newClients.length; i > 0; i--) {
        exportedStream.pipe(newClients[i-1]);
        newClients[i-1].on('error', function (exc) {
            console.log("ignoring exception: " + exc);
        });
        newClients.pop();
    }
}
