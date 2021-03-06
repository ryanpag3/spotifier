var nodemailer = require('nodemailer'),
    ses = require('nodemailer-ses-transport'),
    querystring = require('querystring'),
    EmailTemplate = require('email-templates').EmailTemplate,
    path = require('path'),
    Q = require('q'),
    Promise = require('bluebird'),
    User = require('../models/user'),
    Artist = require('../models/artist'),
    Db = require('./db'),
    logger = require('./logger'),
    configPrivate = require('../../config-private'),
    configPublic = require('../../config-public');

/**
 * define the email authentication information
 * @constructor
 */
var Email = function () {
    // are we in production?
    if (process.env.NODE_ENV) {
        this.transporter = nodemailer.createTransport(ses({
            accessKeyId: configPrivate.aws.secret_id,
            secretAccessKey: configPrivate.aws.secret_key,
            region: 'us-west-2'
        }));
    } else {
        this.transporter = nodemailer.createTransport(ses({
            accessKeyId: configPrivate.test.aws.secret_id,
            secretAccessKey: configPrivate.test.aws.secret_key,
            region: 'us-east-1'
        }));
        // this.transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: configPrivate.gmail.user,
        //         pass: configPrivate.gmail.password
        //     }
        // })
    }

};

/**
 * Send an email
 * @param options: mailer options specified in respective email setup functions
 * @returns {Q.Promise<T>}
 */
Email.prototype.send = function (options) {
    var deferred = Q.defer();
    if (validateEmailOptions(options)) {
        this.transporter.sendMail(options, function (err, info) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve('sent: ' + info.response);
            }
        });
    } else {
        deferred.resolve('email options incorrectly set.');
    }
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
        logger.info('trying to send new release batch!');
        // query for users with new_release field not empty
        User.find({
            'new_releases': {
                $ne: []
            }
        }, function (err, users) {
            logger.info(`${users.length} users to be notified.`);
            if (err) {
                logger.error(err);
            }
            if (users && users.length > 0) { // if users still have new_releases pending
                var master = users[0]; // master is the user we will query for all matching artist patterns with
                // query for users with an email address and new releases that are equal to the master
                User.find({
                    $and: [{
                        'email.address': {
                            $ne: null
                        }
                    }, {
                        'new_releases': {
                            $eq: master.new_releases
                        }
                    }]
                }, function (err, users) {
                    logger.info(`${users.length} users to be notified in this batch.`);
                    var addresses = [];
                    // catch err
                    if (err) {
                        logger.error(err);
                    }

                    // build the recipients
                    for (var i = 0; i < users.length; i++) {
                        addresses.push(users[i].email.address);
                    }
                    // query for artists with an id in the selected array
                    Artist.find({
                        '_id': {
                            $in: master.new_releases
                        }
                    }, 'name recent_release', function (err, artists) {
                        logger.info(`${artists.length} artists in email.`);
                        var templateDir = path.join(__dirname, '../templates', 'new-release-email');
                        var newReleaseEmail = new EmailTemplate(templateDir);
                        // catch err
                        if (err) {
                            logger.error(err);
                        }

                        var unsubUrl = process.env.NODE_ENV ? 'https://spotifier.io/unsubscribe' : 'http://localhost:3000/unsubscribe';
                        // render email template
                        newReleaseEmail.render({
                            artists: artists,
                            url: unsubUrl
                        }, async function (err, result) {
                            // catch err
                            if (err) {
                                logger.error('unable to render release email: ' + err);
                            } else if (validateTemplate(result)) {
                                var today = new Date(Date.now()).toLocaleDateString('en-US');
                                // define email options
                                var mailOptions = {
                                    from: configPrivate.domain.email,
                                    to: addresses,
                                    subject: 'New releases on Spotify for ' + today + '.',
                                    html: result.html,
                                    text: result.text
                                };
                                let promises = [];

                                console.log('attempting to send batch!');
                                for (let email of addresses) {
                                    logger.info('pushing');
                                    promises.push({
                                        from: configPrivate.domain.email,
                                        to: email,
                                        subject: `New releases on Spotify for ${today}.`,
                                        html: result.html,
                                        text: result.text
                                    })
                                }
                                await Promise.map(promises, async emailOptions => {
                                    try {
                                        logger.info(`Sending email to ${emailOptions.to}`);
                                        return await self.send(emailOptions);
                                    } catch (e) {
                                        logger.error(`Could not send email to recipient. ${e}`);
                                    }
                                }, {
                                    concurrency: 5
                                });

                                User.updateMany({
                                    'new_releases': {
                                        $all: master.new_releases,
                                        $size: master.new_releases.length
                                    }
                                }, {
                                    $set: {
                                        'new_releases': []
                                    }
                                }, function (err) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    logger.info('sent new release batch');
                                    sendNewReleaseBatch(); // process next release batch and send
                                });

                                // // send
                                // self.send(mailOptions)
                                //     .then(function () {
                                //         // remove new_release data from users who we just sent email to
                                //         User.updateMany({
                                //             'new_releases': {
                                //                 $all: master.new_releases,
                                //                 $size: master.new_releases.length
                                //             }
                                //         }, {
                                //             $set: {
                                //                 'new_releases': []
                                //             }
                                //         }, function (err) {
                                //             if (err) {
                                //                 logger.error(err);
                                //             }
                                //             logger.info('sent new release batch');
                                //             sendNewReleaseBatch(); // process next release batch and send
                                //         });

                                //     })
                                //     .catch(function (err) {
                                //         logger.error('error while sending ' + err);
                                //         // if email fails to send, we set a backoff of 2 mins before retrying
                                //         setTimeout(function () {
                                //             sendNewReleaseBatch();
                                //         }, 120000);
                                //     });
                            }
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
 * Send a confirmation email for the specified user
 * @param user
 * @returns {Q.Promise<T>}
 */
Email.prototype.sendConfirmationEmail = function (user) {
    var email = this,
        db = new Db(),
        deferred = Q.defer();
    db.getUser(user) // get user information
        .then(function (user) {
            // is the user confirmed already?
            if (user.email.confirmed !== true) {
                var confirmCode = generateConfirmCode(configPublic.confirmCodeLength);
                var query = querystring.stringify({ // build query string
                    code: confirmCode,
                    id: user._id.toString()
                });

                // setup email template
                var templateDir = path.join(__dirname, '../templates', 'confirmation-email');
                var confirmEmail = new EmailTemplate(templateDir);
                var confirmUrl = (process.env.NODE_ENV ? configPublic.prodUrl : configPublic.url) + '/user/email/confirm?' + query;
                var templateVals = {
                    url: confirmUrl
                };
                // render email template
                confirmEmail.render(templateVals, function (err, result) {
                    if (err) {
                        logger.error(err);
                    } else if (validateTemplate(result)) {
                        var mailOptions = {
                            from: configPrivate.domain.email,
                            to: user.email.address,
                            subject: 'Here\'s your confirmation link!',
                            html: result.html,
                            text: result.text
                        };
                        logger.info(`Sending confirmation email to ${user.email.address}`);
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
                    } else {
                        logger.error('there was an error creating the email template!')
                    }
                });
            }
        })
        .catch(function (err) { // catch getUser err
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * Flags a user as successfully confirmed in the database.
 * @param query
 */
Email.prototype.confirm = function (query) {
    var deferred = Q.defer();
    User.findOne({
        '_id': query.id
    }, function (err, user) {
        // mongo err thrown
        if (err) {
            deferred.reject(err);
        }
        // if user exists
        if (user) {
            // if user confirm code matches
            if (user.email.confirm_code === query.code) {
                User.update({
                    '_id': user._id
                }, {
                    email: {
                        address: user.email.address,
                        confirmed: true,
                        confirm_code: undefined
                    }
                }, function (err) {
                    if (err) {
                        logger.error(err);
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                })
            } else {
                var error = 'invalid confirm code';
                logger.error(error);
                deferred.reject(error);
            }
        } else {
            var error = 'user not found!';
            logger.error(error);
            deferred.reject(error);
        }
    });
    return deferred.promise;
};

Email.prototype.getStatus = function (user) {
    var deferred = Q.defer();
    User.findOne({
        '_id': user._id
    }, function (err, user) {
        if (err) {
            deferred.reject(err);
        }
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

/**
 * simple boolean helper function to make sure the server doesn't crash
 * if the templates don't exist.
 * @param template
 * @returns {*}
 */
function validateTemplate(template) {
    return template.html && template.text;
}

/**
 * Validates to make sure that all mail options are set before sending
 * @param options
 * @returns {*}
 */
function validateEmailOptions(options) {
    if (!options || !options.from || !options.to) return false;
    return options.from && options.to.length > 0 && options.subject && options.html && options.text;
}