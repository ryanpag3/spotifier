var nodemailer = require('nodemailer'),
    Db = require('../utils/db-wrapper'),
    configPrivate = require('../../config-private'),
    configPublic = require('../../config-public');

var Email = function() {
    this.transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: configPrivate.gmail.username,
            pass: configPrivate.gmail.password
        }
    });
};

Email.prototype.send = function(options) {
    console.log('we here doh');
  this.transporter.sendMail(options, function(err, info) {
      if (err) {
          console.log(err);
      } else {
          console.log('sent: ' + info.response);
      }
  })
};

Email.prototype.sendConfirmationEmail = function(user) {
    console.log('we here...');
    var email = this;
    var db = new Db();
    db.getUser(user)
        .then(function(user) {
            var confirmCode = generateConfirmCode(configPublic.confirmCodeLength);
            db.setConfirmCode(user, confirmCode)
                .then(function() {
                    var confirmUrl = configPublic.url + '/' + confirmCode;
                    var mailOptions = {
                        from: configPrivate.gmail.username,
                        to: configPrivate.gmail.username,
                        subject: 'test confirmation',
                        html: '<a href="'+ confirmUrl+'">' + confirmUrl + '</a>'
                    };
                    email.send(mailOptions);
                })
        })
        .catch(function(err) {
            console.log(err);
        })
};

module.exports = Email;

/** HELPER METHODS **/
function generateConfirmCode(length) {
    var potential = 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = '';
    for (var i = 0; i < length; i++) {
        var pos = Math.floor(Math.random() * potential.length);
        code += potential.charAt(pos);
    }
    console.log(code);
    return code;
}

