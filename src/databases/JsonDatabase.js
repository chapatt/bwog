import fs from 'fs';
import beautify from 'js-beautify';

class JsonDatabase {
    constructor(file) {
        this.file = file;
    }

    async connect() {
        const { default: posts } = await import(this.file, {with: {type: 'json'}});
        this.posts = posts;
        this.posts.sort((a, b) => a.createdAt > b.createdAt ? -1 : (a.createdAt < b.createdAt ? 1 : 0));
    }

    async getAll() {
        return this.posts;
    }

    async getLastTwoMonthsAtLeast20() {
        return this.posts;
    }

    async createPost(post) {
        this.posts.push(post);

        try {
            const json = beautify.js(
                JSON.stringify(this.posts),
                {end_with_newline: true},
            );
            fs.writeFileSync(this.file, json);
        } catch (err) {
            throw (`Failed to write file: ${this.file}`);
        }
    }
}

export default JsonDatabase;
