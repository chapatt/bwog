const path = require('path');
const fs = require('fs');

const Generator = require(path.resolve(__dirname, './generator.js'));

module.exports = class Controller {
    createPost(formData, user) {
        let post = {
            author: user.name,
            createdAt: (new Date()).toISOString().split('.')[0] + "Z",
            text: formData.text.replaceAll('\r\n', '\n'),
        };
        const trackStrings = formData.tracks.replaceAll('\r\n', '\n').split('\n');
        const trackStringsFiltered = trackStrings.filter(track => track !== '');
        const tracks = trackStringsFiltered.map(track => {
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

        console.log(`user posted: ${user.name} <${user.email}>`);
        console.log(post);

        const posts = require(process.env['SOURCE_JSON']);
        posts.push(post);

        try {
            fs.writeFileSync(process.env['SOURCE_JSON'], JSON.stringify(posts));
        } catch (err) {
            throw (`Failed to write file: ${process.env['SOURCE_JSON']}`);
        }

        const generator = new Generator();
        generator.generate(`https://${process.env['SITE_DOMAIN']}`, posts, process.env['PUBLIC_PATH']);
    }
};
