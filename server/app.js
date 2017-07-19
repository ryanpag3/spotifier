/**
 * Created by ryan on 7/17/2017.
 */
var path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    passport = require('passport'),
    SpotifyStrategy = require('passport-spotify').Strategy,
    session = require('express-session');

/*
    handle middleware
 */
const setupApp = function(app, express) {
    var scopes = ['user-read-private', 'user-read-email'],
        redirectUri = 'http://localhost:3000/callback',
        clientSecret = '7e3b3a161dc6442f974655a3209505cd',
        clientId = '180cc653f1f24ae9864d5d718d68f3c6';

    /*
        Passport session setup.
        To support persistent login sessions, passport needs to be able to serialize users
        int and deserialize users out of the session. Right now, the entire spotify profile is
        serialized and deserialized. Once a user db is created, we should simply use an ID.
     */
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
       done(null, obj);
    });

    // use the spotify strategy in passport
    passport.use(new SpotifyStrategy({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: redirectUri
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            // TODO
            // associate spotify account with a user record in db
            // return that user record instead
           return done(null, profile);
        });
    }));








    // serve angular front end files
    app.use('/', express.static('public', {redirect: false}));

    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(session({
        secret: 'spotifier secret',
        resave: false,
        saveUninitialized: false
    }));

    // initialize passport
    app.use(passport.initialize());
    app.use(passport.session());

    // serve angular front end files
    app.use(express.static(path.join(__dirname, '../public')));

    // require routes
    var authRoute = require('./routes/auth.js');
    // routes
    app.use('/user/', authRoute);

    app.get('*', function(req, res, next) {
       res.sendFile(path.join(__dirname, '../public/index.html'));
    });


    // error handlers
    app.use(function(req, res, next) {
      var err = new Error('not found');
      err.status = 404;
      // report error in middleware
      next(err);
    });

    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.end(JSON.stringify({
            message: err.message,
            error: {}
        }));
    });
};

module.exports = setupApp;
