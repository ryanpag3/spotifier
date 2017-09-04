/**
 * Created by ryan on 7/17/2017.
 */
var express = require('express'),
    fs = require('fs'),
    app = express(),
    http = require('http'),
    Socket = require('./utils/socket'),
    httpServer = http.createServer(app),
    // setup sockets
    io = require('socket.io')(httpServer),
    socket = new Socket(io);
    app.set('socketio', socket);

require('./app.js')(app, express, socket); // expose middleware/setup application
require('./utils/cron'); // initialize cron jobs

httpServer.listen(3000, function () {
    console.log('Server successfully launched on port 3000');
});

