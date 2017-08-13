/**
 * Created by ryan on 7/17/2017.
 */
var express = require('express'),
    cluster = require('cluster'),
    app = express(),
    server = require('http').createServer(app);

require('./app.js')(app, express); // expose middleware/setup application

if (cluster.isMaster) {
    server.listen(3000, function() {
        console.log('Server successfully launched on port 3000');
    });
}

