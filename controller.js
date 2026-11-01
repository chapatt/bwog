import {generate} from 'short-uuid';

import Generator from './generator.js';

class Controller {
    constructor(store, database) {
        this.store = store;
        this.database = database;
    }

    async createPost(formData, user) {
        if (!formData.text && !formData.tracks) {
            return null;
        }
        let post = {
            id: generate(),
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

        this.database.createPost(post);

        const generator = new Generator(this.store, this.database);
        generator.generatePartial(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], process.env['PUBLIC_PATH'], post);

        console.log(`user posted: ${user.name} <${user.email}>`);
        console.log(post);

        return post;
    }
}

export default Controller;
