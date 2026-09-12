import fs from 'fs';
import {generate} from 'short-uuid';
import beautify from 'js-beautify';

import Generator from './generator.js';
import path from "path";

class Controller {
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

        const { default: posts } = await import(process.env['SOURCE_JSON'], {with: {type: 'json'}});
        posts.push(post);

        try {
            const json = beautify.js(
                JSON.stringify(posts),
                {end_with_newline: true},
            );
            fs.writeFileSync(process.env['SOURCE_JSON'], json);
        } catch (err) {
            throw (`Failed to write file: ${process.env['SOURCE_JSON']}`);
        }

        const generator = new Generator();
        generator.generatePartial(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], process.env['PUBLIC_PATH'], posts, post);

        console.log(`user posted: ${user.name} <${user.email}>`);
        console.log(post);

        return post;
    }
}

export default Controller;
