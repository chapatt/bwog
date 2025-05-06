const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

const router = express.Router();

router.post('/post', ensureLoggedIn('/login'), (req, res) => {
    let post = {};
    post.text = req.body.text.replaceAll('\r\n', '\n');
    const trackStrings = req.body.tracks.replaceAll('\r\n', '\n').split('\n');
    const tracks = trackStrings.map(track => {
        const tuple = track.split(' - ');
        return {
            artist: tuple[0],
            title: tuple[1],
        };
    });
    post.type = tracks.length > 0
        ? (tracks.length > 1 ? 'playlist' : 'song')
        : 'text';

    switch (post.type) {
        case 'playlist':
            post.tracks = tracks;
            break;
        case 'song':
            post = {...post, ...tracks[0]};
            break;
        case 'text':
        default:
            break;
    }

    console.log(`user posted: ${req.user.name} <${req.user.email}>`);
    console.log(post);
    res.redirect('/');
});

module.exports = router;
