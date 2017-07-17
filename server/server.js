/**
 * Created by dev on 7/17/2017.
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
require('./app.js')(app, express);

server.listen(3000, function() {
   console.log('Server successfully launched on port 3000');
});
