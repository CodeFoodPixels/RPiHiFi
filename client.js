var net = require('net'),
    speakerLib = require('speaker'),
    speaker = new speakerLib(),
    stream = require('stream').Readable,
    client = net.connect({port: 8080}, function() {
});

client.pipe(speaker);
