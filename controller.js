import {generate} from 'short-uuid';

import Generator from './generator.js';

class Controller {
    constructor(store, database) {
        this.store = store;
        this.database = database;
    }

    async createPost(data, user) {
        const post = {
            ...data,
            id: generate(),
            author: user.name,
            createdAt: (new Date()).toISOString().split('.')[0] + 'Z',
        };

        this.database.createPost(post);

        const generator = new Generator(this.store, this.database);
        await generator.generatePartial(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], process.env['ENABLE_AP'] === 'true', post);

        console.log(`user posted: ${user.name} <${user.email}>`);
        console.log(post);

        return post;
    }
}

export default Controller;
