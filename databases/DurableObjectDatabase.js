class DurableObjectDatabase {
    constructor(file) {
        this.file = file;
    }

    async connect() {
    }

    importPosts(posts) {
        this.db.exec(`
            CREATE TABLE posts (
                id TEXT PRIMARY KEY,
                author TEXT NOT NULL,
                created_at TEXT NOT NULL,
                content JSONB NOT NULL
            );
        `);

        posts.forEach(post => {
            const content = {...post};
            delete content.id;
            delete content.author;
            delete content.createdAt;
            this.db.exec(
                'INSERT INTO posts (id, author, created_at, content) VALUES (?, ?, ?, jsonb(?));',
                post.id,
                post.author,
                post.createdAt,
                JSON.stringify(content)
            );
        });
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
