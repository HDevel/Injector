var http = require('http'),
    static = require('node-static');

var server = http.createServer(function(req, res) {
    req.addListener('end', function () {
        new static.Server('./public').serve(req, res);
    }).resume();
});

server.listen(5000, function() {
    console.log('Listening at: http://localhost:5000');
});

var injector = require('./injector');
injector.init();
