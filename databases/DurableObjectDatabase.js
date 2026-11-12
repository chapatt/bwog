class DurableObjectDatabase {
    constructor(file) {
        this.file = file;
    }

    async connect() {
    }

    async initSchema() {
        return this.file.initSchema();
    }

    async importPosts(posts) {
        return this.file.importPosts(posts);
    }

    async getAll() {
        return this.file.getAll();
    }

    async getLastTwoMonthsAtLeast20() {
        return this.file.getLastTwoMonthsAtLeast20();
    }

    async createPost(post) {
        return this.file.createPost(post);
    }
}

export default DurableObjectDatabase;
