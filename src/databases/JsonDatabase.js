import fs from 'fs';
import beautify from 'js-beautify';

class JsonDatabase {
    constructor(file) {
        this.file = file;
    }

    async connect() {
    }

    async _reload() {
        const { default: posts } = await import(this.file, {with: {type: 'json'}});
        this.posts = posts;
        this.posts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }

    async initSchema() {
        return Promise.resolve();
    }

    async getAll() {
        await this._reload();
        return this.posts;
    }

    async getLastTwoMonthsAtLeast20() {
        await this._reload();
        return this.posts;
    }

    async createPost(post) {
        await this._reload();
        this.posts.push(post);

        try {
            const json = beautify.js(
                JSON.stringify(this.posts),
                {end_with_newline: true},
            );
            fs.writeFileSync(this.file, json);
        } catch (err) {
            throw new Error(`Failed to write file: ${this.file}`);
        }
    }
}

export default JsonDatabase;
