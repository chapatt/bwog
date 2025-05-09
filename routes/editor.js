const path = require('path');
const express = require('express');

const Controller = require(path.resolve(__dirname, '../controller.js'));

const router = express.Router();

router.post('/post', (req, res) => {
    if (!req.isAuthenticated()) {
        req.session.pendingPost = req.body;
        res.redirect('/login');
    }
    const controller = new Controller();
    controller.createPost(req.body, req.user);
    res.redirect('/');
});

module.exports = router;
