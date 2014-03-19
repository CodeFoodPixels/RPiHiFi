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
    ws = Writable(),
    discard = "";

ws._write = function (chunk, enc, next) {
    next();
};

decoder.on("format", function(data){
    throttle = new Throttle((data.sampleRate*data.bitDepth*data.channels)/8);
    throttledStream = stream.pipe(throttle);
    discard = throttledStream.pipe(ws);
    server = net.createServer(function(socket) {
            socket.pipe(socket);
            throttledStream.pipe(socket);
            socket.on('error', function (exc) {
                console.log("ignoring exception: " + exc);
            });
        });
    server.listen(8080);
})
