const path = require('path');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

const Controller = require(path.resolve(__dirname, '../controller.js'));

passport.use(new GoogleStrategy({
        clientID: process.env['GOOGLE_OAUTH_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_OAUTH_CLIENT_SECRET'],
        callbackURL: `https://${process.env['SITE_DOMAIN']}/oauth2/redirect/google`,
        scope: ['profile', 'email'],
        state: true,
        store: true,
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

router.get('/login', (req, res, next) => {
    passport.authenticate('google', {
        state: {pendingPost: req.session.pendingPost},
    })(req, res, next);
});

router.get('/oauth2/redirect/google',
    passport.authenticate('google', {
        failureRedirect: '/loginFailure'
    }), (req, res) => {
        console.log(`user logged in: ${req.user.name} <${req.user.email}>`);
        res.cookie('isAuthed', true);

        if (req.authInfo.state.pendingPost) {
            const controller = new Controller();
            controller.createPost(req.authInfo.state.pendingPost, req.user);
        }

        res.redirect('/');
    }
);

router.get('/loginFailure', (req, res) => {
    console.log(`user failed to log in`);
    res.clearCookie('isAuthed');
    res.redirect('/');
});

router.get('/logout', (req, res, next) => {
    const userName = req.user?.name;
    const userEmail = req.user?.email;
    res.clearCookie('isAuthed');
    req.logout(error => {
        if (error) {
            console.log(`user failed to log out: ${userName} <${userEmail}>`);
            return next(error);
        }
        console.log(`user logged out: ${userName} <${userEmail}>`);
        res.redirect('/');
    });
});

module.exports = router;