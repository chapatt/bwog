import {generate} from 'short-uuid';
import { getExtension } from 'hono/utils/mime'

import Generator from './Generator.js';

class Controller {
    constructor(store, database) {
        this.store = store;
        this.database = database;
    }

    async createPost(data, user) {
        if (data.attachments) {
            for (const [key, blob] of Object.entries(data.attachments)) {
                const path = `${generate()}.${getExtension(blob.type)}`;
                await this.store.write(`cdn/${path}`, blob, blob.type);
                data.attachments[key] = path;
            }
        }

        const post = {
            ...data,
            id: generate(),
            author: user.name,
            createdAt: (new Date()).toISOString().split('.')[0] + 'Z',
        };

        await this.database.createPost(post);

        const generator = new Generator(this.store, this.database);
        await generator.generatePartial(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], process.env['ENABLE_AP'] === 'true', post);

        console.log(`user posted: ${user.name} <${user.email}>`);
        console.log(post);

        return post;
    }
}

export default Controller;
