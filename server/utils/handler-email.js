var nodemailer = require('nodemailer'),
    querystring = require('querystring'),
    pug = require('pug'),
    EmailTemplate = require('email-templates').EmailTemplate,
    path = require('path'),
    Q = require('q'),
    User = require('../models/user'),
    Artist = require('../models/artist'),
    Db = require('./handler-db'),
    configPrivate = require('../../config-private'),
    configPublic = require('../../config-public');

var Email = function () {
    this.transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: configPrivate.gmail.username,
            pass: configPrivate.gmail.password
        }
    });
};

/**
 * todo
 * @param options
 * @returns {Q.Promise<T>}
 */
Email.prototype.send = function (options) {
    var deferred = Q.defer();
    this.transporter.sendMail(options, function (err, info) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve('sent: ' + info.response);
        }
    });
    return deferred.promise;
};

/**
 * This is called after the new release scanner finishes processing
 * the artists in the artist collection, adding new_release flags to
 * users tracking artists with new releases. It selects the first user
 * of the user list with a new_release field not null, and queries for
 * all users with that same combination of elements. Builds a email body
 * based on those artists that they track, sends the email, and clears
 * the associated users new_release fields, and repeats until there
 * are no more new_release fields not null.
 */
Email.prototype.sendNewReleaseEmails = function () {
    var self = this;
    var deferred = Q.defer();

    sendNewReleaseBatch();

    function sendNewReleaseBatch() {
        // query for users with new_release field not empty
        User.find({'new_releases': {$ne: []}}, function (err, users) {
            if (err) {
                console.log(err);
            }
            if (users && users.length > 0) { // if users still have new_releases pending
                var master = users[0]; // master is the user we will query for all matching artist patterns with
                User.find({
                    'new_releases': {
                        $all: master.new_releases,
                        $size: master.new_releases.length
                    }
                }, function (err, users) {
                    if (err) {
                        console.log(err);
                    }
                    var addresses = [];
                    // build the 'to' option
                    for (var i = 0; i < users.length; i++) {
                        addresses.push(users[i].email.address);
                    }
                    // grab artist info
                    Artist.find({'_id': {$in: master.new_releases}},'name recent_release', function (err, artists) {
                        if (err) {
                            console.log(err);
                        }
                        var templateDir = path.join(__dirname, '../templates', 'new-release-email');
                        var newReleaseEmail = new EmailTemplate(templateDir);
                        console.log(artists);
                        newReleaseEmail.render({artists: artists}, function(err, result) {
                            if (err) {
                                console.log(err);
                            }
                            var mailOptions = {
                                from: configPrivate.gmail.username,
                                to: addresses,
                                subject: 'New Release Found!',
                                html: result.html
                            };
                            self.send(mailOptions)
                                .then(function () {
                                    // remove new_release data from users who we just sent email to
                                    User.updateMany({
                                            'new_releases': {
                                                $all: master.new_releases,
                                                $size: master.new_releases.length
                                            }
                                        },
                                        {$set: {'new_releases': []}}, function (err) {
                                            if (err) {
                                                // todo turn into debug statement
                                                console.log(err);
                                            }
                                            console.log('run');
                                            sendNewReleaseBatch(); // process next release batch and send
                                        });

                                })
                                .catch(function (err) {
                                    console.log(err);
                                    setTimeout(function () {
                                        sendNewReleaseBatch();
                                    }, 120000);
                                });
                        });
                    });
                })
            } else {
                deferred.resolve();
            }
        });
    }

    return deferred.promise;
};

/**
 * todo
 * @param user
 * @returns {Q.Promise<T>}
 */
Email.prototype.sendConfirmationEmail = function (user) {
    var email = this,
        db = new Db(),
        deferred = Q.defer();
    db.getUser(user)
        .then(function (user) {
            if (user.email.confirmed !== true) {
                var confirmCode = generateConfirmCode(configPublic.confirmCodeLength);
                var query = querystring.stringify({
                    code: confirmCode,
                    id: user._id.toString()
                });

                var templateDir = path.join(__dirname, '../templates', 'confirmation-email');
                var confirmEmail = new EmailTemplate(templateDir);
                var confirmUrl = configPublic.url + '/user/email/confirm?' + query;
                var templateVals = {url: confirmUrl};

                // debugging
                // console.log(pug.renderFile(path.join(__dirname, '../templates/confirmation-email', 'html.pug'),
                //     {
                //         url: confirmUrl
                //     }));

                confirmEmail.render(templateVals, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    var mailOptions = {
                        from: configPrivate.gmail.username,
                        to: user.email.address,
                        subject: 'Here\'s your confirmation link!',
                        html: result.html,
                        text: result.text
                    };
                    email.send(mailOptions)
                        .then(function (successMsg) {
                            db.setConfirmCode(user, confirmCode)
                                .catch(function (err) { // catch setConfirmCode err
                                    deferred.reject(err);
                                });
                            deferred.resolve(successMsg);
                        })
                        .catch(function (err) { // catch send err
                            deferred.reject(err);
                        })
                });

            } else {
                var mailOptions = {
                    from: configPrivate.gmail.username,
                    to: user.email.address,
                    subject: 'already confirmed',
                    text: 'this email address has already been confirmed! :)'
                }
            }
        })
        .catch(function (err) { // catch getUser err
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * todo
 * @param query
 */
Email.prototype.confirm = function (query) {
    var deferred = Q.defer();
    User.findOne({'_id': query.id}, function (err, user) {
        // mongo err thrown
        if (err) {
            deferred.reject(err);
        }
        // if user exists
        if (user) {
            // if user confirm code matches
            if (user.email.confirm_code === query.code) {
                User.update({'_id': user._id}, {
                    email: {
                        address: user.email.address,
                        confirmed: true,
                        confirm_code: undefined
                    }
                }, function (err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                })
            }
            else {
                deferred.reject('invalid confirm code');
            }
        } else {
            deferred.reject('user not found!');
        }
    });
    return deferred.promise;
};

Email.prototype.getStatus = function (user) {
    var deferred = Q.defer();
    User.findOne({'_id': user._id}, function (err, user) {
        if (err) {
            deferred.reject(err);
        }
        console.log(user.email.confirmed);
        deferred.resolve(user.email.confirmed);
    });
    return deferred.promise;
};

module.exports = new Email();

/** HELPER METHODS **/
function generateConfirmCode(length) {
    var potential = 'abcdefghijklmnopqrstuvwqxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = '';
    for (var i = 0; i < length; i++) {
        var pos = Math.floor(Math.random() * potential.length);
        code += potential.charAt(pos);
    }
    return code;
}

