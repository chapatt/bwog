const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

passport.use(new GoogleStrategy({
        clientID: process.env['GOOGLE_OAUTH_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_OAUTH_CLIENT_SECRET'],
        callbackURL: '/oauth2/redirect/google',
        scope: [ 'profile' ],
        state: true
    },
    function verify(accessToken, refreshToken, profile, cb) {
        if (GOOGLE_OAUTH_AUTHORIZED_USER_ID === profile.id) {
            cb(null, profile);
        } else {
            return cb(null, false);
        }
    }
));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, {id: user.id, username: user.username, name: user.name});
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});


const router = express.Router();

router.get('/login', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
}));

router.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;