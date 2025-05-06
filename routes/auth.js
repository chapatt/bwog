const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

passport.use(new GoogleStrategy({
        clientID: process.env['GOOGLE_OAUTH_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_OAUTH_CLIENT_SECRET'],
        callbackURL: `https://${process.env['SITE_DOMAIN']}/oauth2/redirect/google`,
        scope: ['profile', 'email'],
        state: true
    },
    (accessToken, refreshToken, profile, cb) => {
        if (process.env['GOOGLE_OAUTH_AUTHORIZED_USER_ID'] === profile.id) {
            cb(null, {id: profile.id, name: profile.displayName, email: profile.emails[0].value});
        } else {
            return cb(null, false);
        }
    }
));

passport.serializeUser((user, cb) => {
    process.nextTick(() => {
        cb(null, {id: user.id, name: user.name, email: user.email});
    });
});

passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user);
    });
});


const router = express.Router();

router.get('/login', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
    successReturnToOrRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
}));

router.get('/loginSuccess', (req, res) => {
    res.cookie('isAuthed', true);
    res.redirect('/');
});

router.get('/loginFailure', (req, res) => {
    res.clearCookie('isAuthed');
    res.redirect('/');
});

router.get('/logout', (req, res, next) => {
    res.clearCookie('isAuthed');
    req.logout(error => {
        if (error) {
            return next(error);
        }
        res.redirect('/');
    });
});

module.exports = router;