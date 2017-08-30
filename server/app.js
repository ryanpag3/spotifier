/**
 * Created by ryan on 7/17/2017.
 */
var path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    passport = require('passport'),
    SpotifyStrategy = require('passport-spotify').Strategy,
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    helmet = require('helmet'),
    syncLibraryQueue = require('./utils/queue-sync-user-library'),
    getArtistDetailsQueue = require('./utils/queue-get-artist-details');
    mongoose.Promise = require('bluebird');
/*
    handle middleware
 */
const setupApp = function(app, express, socketUtil) {
    var redirectUri = 'https://localhost:3000/user/callback',
        clientSecret = 'a0d232e3a1844de785777c20944f2618',
        clientID = '5c3f5262d39e44ec999a8a0a9babac3e';

    mongoose.connect('mongodb://localhost/spotifier', {
        useMongoClient: true
    });

    /*
        Passport session setup.
        To support persistent login sessions, passport needs to be able to serialize users
        in and deserialize users out of the session. Right now, the entire spotify profile is
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
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: redirectUri
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            // this is what will be serialized in the cookie
            return done(null, {name: profile.id, accessToken: accessToken, refreshToken: refreshToken});
        });

    }));

    // pass socketUtility to queues
    syncLibraryQueue.setSocketUtil(socketUtil);
    getArtistDetailsQueue.setSocketUtil(socketUtil);

    app.use(helmet());
    app.use(cookieParser());
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
    app.use(session({
        secret: 'spotifier secret',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));

    // initialize passport
    app.use(passport.initialize());
    app.use(passport.session());

    // serve angular front end files
    app.use('/', express.static('public', {redirect: false}));
    // serve angular front end files
    app.use(express.static(path.join(__dirname, '../public')));

    // require routes
    var authRoute = require('./routes/auth.js');
    var libraryRoute = require('./routes/library.js');
    var artistRoute = require('./routes/artist.js');

    // routes
    app.use('/user/', authRoute);
    app.use('/library/', libraryRoute);
    app.use('/artist/', artistRoute);

    // for handling html5mode
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
