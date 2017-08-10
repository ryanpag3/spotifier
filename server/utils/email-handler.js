var nodemailer = require('nodemailer'),
    Db = require('../utils/db-wrapper'),
    config = require('../../config-private');

var Email = function() {
    this.transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.gmail.username,
            pass: config.gmail.password
        }
    });
};

Email.prototype.send = function() {
  var mailOptions = {
      from: config.gmail.username,
      to: config.gmail.username,
      subject: 'test email',
      text: 'testing sending an email!'
  };

  this.transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
          console.log(err);
      } else {
          console.log('sent: ' + info.response);
      }
  })
};

Email.prototype.sendConfirmationEmail = function(user) {
    var email = this;
    var db = new Db();
    db.getUser(user)
        .then(function(user) {

        })
};

module.exports = Email;

/** HELPER METHODS **/
function generateConfirmCode(length) {
    var potential = 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = null;
    for (var i = 0; i < length; i++) {
        var pos = Math.floor(Math.random() + length);
        code.push(potential.charAt(pos));
    }
    return code;
}

