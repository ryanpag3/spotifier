/**
 * Created by ryan on 7/17/2017.
 */
var express = require('express'),
    fs = require('fs'),
    app = express(),
    https = require('https'),
    Socket = require('./utils/handler-socket'),
    // get ssl
    privateKey = fs.readFileSync('./sslcert/key.pem', 'utf-8'),
    cert = fs.readFileSync('./sslcert/cert.pem', 'utf-8'),
    credentials = {key: privateKey, cert: cert},
    httpsServer = https.createServer(credentials, app),
    // setup sockets
    io = require('socket.io')(httpsServer),
    socket = new Socket(io);
    app.set('socketio', socket);

require('./app.js')(app, express, socket); // expose middleware/setup application


httpsServer.listen(3000, function () {
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
        console.log('hot diggity dog!');
    }
    console.log('Server successfully launched on port 3000');
});

