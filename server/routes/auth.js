/**
 * Created by ryan on 7/18/2017.
 */
var express = require('express'),
    passport = require('passport'),
    SpotifyApi = require('spotify-web-api-node'),
    randomstring = require('randomstring'),
    url = require('url'),
    config = require('../../config-public'),
    pConfig = require('../../private/config.json'),
    Db = require('../utils/db.js'),
    email = require('../utils/email'),
    logger = require('../utils/logger'),
    mSpotifyApi = require('../utils/spotify-api'), // working on migrating to only using this
    router = express.Router();

const STATE_KEY = 'spotify_auth_state';
const SPOTIFY_USERNAME = 'spotify_username';

var spotifyCreds = process.env.NODE_ENV ? pConfig.spotify : pConfig.test.spotify;
var redirectUri = (process.env.NODE_ENV ? config.prodUrl : config.url) + '/callback';
const scopes = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'playlist-modify-private',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-read-collaborative'
];

const spotifyApi = new SpotifyApi({
    clientId: spotifyCreds.client_id,
    clientSecret: spotifyCreds.client_secret,
    redirectUri: redirectUri
});


router.get('/login', passport.authenticate('spotify', {
        scope: ['user-read-private', 'user-read-email', 'user-library-read', 'playlist-modify-private', 'playlist-modify-public', 'playlist-read-private', 'playlist-read-collaborative'],
        showDialog: true
    }),
    // callback function
    function (req, res) {
        // this request redirects to spotify so it wont be called
    });

router.get('/test', function (req, res) {
    logger.info(JSON.stringify(spotifyCreds.client_id));
    const state = randomstring.generate(16);
    res.cookie(STATE_KEY, state);
   // res.cookie(SPOTIFY_USERNAME, Buffer.from(req.user).toString('base64'));
    const url = spotifyApi.createAuthorizeURL(scopes, state);
    logger.info(url)
    res.send(JSON.stringify(url));
    // res.redirect('https://www.google.com');
})

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/get', function (req, res) {
    if (req.user) {
        var user = {
            _id: req.user._id,
            name: req.user.name
        };
        return res.status(200).json({
            user: user
        })
    } else {
        return res.status(500).json({
            err: 'user not found!'
        })
    }
});

router.get('/status', function (req, res) {
    if (!req.isAuthenticated()) {
        return res.status(200).json({
            isAuthenticated: false
        })
    }
    // return success
    return res.status(200).json({
        isAuthenticated: true
    })
});

router.post('/callback',
    // passport.authenticate('spotify', {
    //     failureRedirect: '/'
    // }),
    async function (req, res) {
        try {
            const devMode = process.env.NODE_ENV != 'production';
            const api = new mSpotifyApi();
            const db = new Db();
            const { code } = req.body;
            const result = await api.handleCodeGrant(code, spotifyApi);      
            const user = await db.createUser(result);
            const emailExists = await db.emailExists(user);

            // console.log(user);
            // console.log(emailExists);
            
            if (!devMode && emailExists == false)
                return res.redirect('/email');
            
            const emailConfirmed = await db.emailConfirmed(user);
            if (!devMode && emailConfirmed && emailConfirmed == false)
                return res.redirect('/confirm-pending');
            
            res.redirect(url.format({
                pathname:'/library',
                query: {
                    user: JSON.stringify({_id: user._id, name: user.name, refresh_token: user.refresh_token})
                }
            }));
        } catch (e) {
            return res.redirect('/'); // phone home
        }

        // DEBUGGING
        // process.env.NODE_ENV ? null : res.redirect('/library');
    });

/**
 * API endpoint for inserting/updating a user's email into the database.
 */
router.post('/email/add', function (req, res) {
    var db = new Db();
    db.addEmail(req.user, req.body.emailAddress)
        .then(function () {
            res.status(200).send();
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            })
        })
});

/**
 * API endpoint for deleting a user's email from the database.
 */
router.post('/email/delete', function (req, res) {
    var db = new Db();
    db.removeEmail(req.user)
        .then(function () {
            res.status(200).send();
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            })
        })
});

router.get('/email/send-confirmation', function (req, res) {
    email.sendConfirmationEmail(req.user)
        .catch(function (err) {
            return res.status(500).json({
                err: err
            })
        });
    res.status(200).send();
});

/**
 * API endpoint for confirming a user's email in the database.
 */
router.get('/email/confirm', function (req, res) {
    email.confirm(req.query)
        .then(function () {
            var t = encodeURIComponent('true');
            res.redirect('/confirmation?success=' + t);
        })
        .catch(function (err) {
            var f = encodeURIComponent('false');
            res.redirect('/confirmation?success=' + f);
        })
});

/**
 * API endpoint for getting a user's email authentication status.
 */
router.get('/email/status', function (req, res) {
    email.getStatus(req.user)
        .then(function (confirmed) {
            return res.status(200).json({
                isConfirmed: confirmed
            })
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            })
        })
});

/**
 * endpoint for unsubscribing a user's email
 */
router.post('/email/unsubscribe', function (req, res) {
    var db = new Db();
    db.unsubscribeEmail(req.body.email)
        .then(function () {
            res.status(200).send();
        })
        .catch(function () {
            res.status(500).send();
        })
});

/**
 * API endpoint for receiving email bounces from Amazon SES.
 * Will call db handler and remove user emails that bounce.
 */
router.post('/email/bounce', function (req, res) {
    // console.log('we bounced!');
    // console.log(req.body);
    // res.sendStatus(200);
    const db = new Db();
    var chunks = [];
    req.on('data', function (chunk) {
        chunks.push(chunk);
    });
    req.on('end', function () {
        var body = JSON.parse(chunks.join(''));
        if (body.Type == 'Notification') {
            const message = JSON.parse(body.Message);
            console.log(message.bounce.bouncedRecipients);
            for (let recipient of message.bounce.bouncedRecipients) {
                db.unsubscribeEmail(recipient.emailAddress);
            }
        } else {
            console.log(body);
        }
    });
    res.end();
});

/**
 * API endpoint for getting notifications for Amazon SES spam complaints.
 * Will call db handler and remove user email's who return complaints.
 */
router.post('/email/complaint', function (req, res) {
    // TODO:
});

/**
 * API endpoint for getting notifications for Amazon SES deliveries.
 */
router.post('/email/delivery', function (req, res) {
    // TODO:
});

/**
 * Called on playlist enabled checkbox change
 */
router.post('/setting/playlist-update', function (req, res) {
    var db = new Db();
    db.changeUserPlaylistSetting(req.user._id, req.body.playlistEnabled)
        .then(function (playlistEnabled) {
            return res.status(200).json({
                playlistEnabled: playlistEnabled
            });
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            });
        });
});

/**
 * Return the current playlist enabled state for a user
 */
router.get('/setting/playlist', function (req, res) {
    var db = new Db();
    db.getUserPlaylistSetting(req.user._id)
        .then(function (playlistEnabled) {
            return res.status(200).json({
                playlistEnabled: playlistEnabled
            });
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            });
        });
});

router.post('/setting/sync-scheduled-update', function (req, res) {
    var db = new Db();
    db.changeUserSyncSchedule(req.user._id, req.body.scheduled)
        .then(function (enabled) {
            return res.status(200).json({
                scheduled: enabled
            });
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            })
        });
});

router.get('/setting/sync-scheduled', function (req, res) {
    var db = new Db();
    db.getUserSyncSchedule(req.user._id)
        .then(function (scheduled) {
            return res.status(200).json({
                scheduled: scheduled
            });
        })
        .catch(function (err) {
            return res.status(500).json({
                err: err
            });
        });
});

module.exports = router;