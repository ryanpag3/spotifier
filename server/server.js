/**
 * Created by ryan on 7/17/2017.
 */
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    Socket = require('./utils/socket'),
    socket = new Socket(io);
    app.set('socketio', socket);


require('./app.js')(app, express); // expose middleware/setup application


server.listen(3000, function () {
    console.log('Server successfully launched on port 3000');
});

