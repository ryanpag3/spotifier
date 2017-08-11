var nodemailer = require('nodemailer'),
    querystring = require('querystring'),
    Q = require('q'),
    User = require('../models/user'),
    Db = require('../utils/db-wrapper'),
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
            var confirmCode = generateConfirmCode(configPublic.confirmCodeLength);
            var query = querystring.stringify({code: generateConfirmCode(configPublic.confirmCodeLength), id: user._id.toString()});
            db.setConfirmCode(user, confirmCode)
                .then(function () {
                    var confirmUrl = configPublic.url + '/user/email/confirm?' + query;
                    var mailOptions = {
                        from: configPrivate.gmail.username,
                        to: user.email.address,
                        subject: 'test confirmation',
                        html: '<a href="' + confirmUrl + '">' + confirmUrl + '</a>'
                    };
                    email.send(mailOptions)
                        .then(function(successMsg) {
                            deferred.resolve(successMsg);
                        })
                        .catch(function(err) { // catch send err
                            deferred.reject(err);
                        })
                })
                .catch(function(err) { // catch setConfirmCode err
                    deferred.reject(err);
                })
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
Email.prototype.confirm = function(query) {
    var deferred = Q.defer();
    User.findOne({'_id': query.id}, function(err, user) {
        // mongo err thrown
        if (err) {
            deferred.reject(err);
        }
        // if user exists
        if (user !== undefined) {
            // if user confirm code matches
            if (user.email.confirm_code === query.code) {
                User.update({'_id': user._id}, {
                    email: {
                        confirmed: true,
                        $unset: {confirm_code: 1}
                    }
                }, function(err) {
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
            deferred.reject('user does not exist');
        }
    });
    return deferred.promise;
};

module.exports = new Email();

/** HELPER METHODS **/
function generateConfirmCode(length) {
    var potential = 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = '';
    for (var i = 0; i < length; i++) {
        var pos = Math.floor(Math.random() * potential.length);
        code += potential.charAt(pos);
    }
    return code;
}

