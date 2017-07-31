/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var User = require('../utils/db-user-wrapper.js');

var self = module.exports = {
     createUser: function(username){
        User.findOne({'username' : username}, function(err, user) {
            if (err) {
                console.log(err);
            }
            // check if exists
            if (user === null) {
                var user = new User({
                    username: username
                }).save();
            }
        })
     },

     userExists: function(username) {
        User.findOne({'username' : username}, function(err, user) {
            if (err) {
                console.log(err);
            }
            return user !== null;
        })
     },

    emailExists: function(username) {
         User.findOne({'username' : username}, function(err, user) {
             if (err) {
                 console.log(err);
             }
             return user !== null && user.email.address !== null;
         })
    },

    emailConfirmed: function(username) {
         User.findOne({'username' : username}, function(err, user) {
             if (err) {
                 console.log(err);
             }
         });
        return user !== null && user.email.confirmed === true;
    }
};