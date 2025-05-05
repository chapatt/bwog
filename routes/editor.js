const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

const ensureLoggedIn = ensureLogIn('/login');

const router = express.Router();

router.post('/post', ensureLoggedIn, function(req, res) {
    console.log('hi, ', req.user.name);
});

module.exports = router;
