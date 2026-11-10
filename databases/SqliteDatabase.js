import { DatabaseSync } from 'node:sqlite';

class SqliteDatabase {
    constructor(file) {
        this.file = file;
    }

    async connect() {
        this.db = new DatabaseSync(this.file);
    }

    makeFromJsonDatabase(JsonDatabase) {
        this.db.exec(`
            CREATE TABLE posts (
                id TEXT PRIMARY KEY,
                author TEXT NOT NULL,
                created_at TEXT NOT NULL,
                content JSONB NOT NULL
            );
        `);

        const insertPost = this.db.prepare('INSERT INTO posts (id, author, created_at, content) VALUES (?, ?, ?, jsonb(?));');

        JsonDatabase.getAll().forEach(post => {
            const content = {...post};
            delete content.id;
            delete content.author;
            delete content.createdAt;
            insertPost.run(post.id, post.author, post.createdAt, JSON.stringify(content));
        });
    }

    getAll() {
        const rawPosts = this.db.prepare(`
            SELECT
                id,
                author,
                created_at,
                json(content) as content
            FROM posts;
        `).all();

        return rawPosts.map(post => ({
            id: post.id,
            author: post.author,
            createdAt: post.created_at,
            ...JSON.parse(post.content)
        }));
    }

    getLastTwoMonthsAtLeast20() {
        const rawPosts = this.db.prepare(`
            WITH latest_two_months AS (
                SELECT DISTINCT strftime('%Y-%m', created_at) AS month
                FROM posts
                ORDER BY month DESC
                LIMIT 2
            ),
            suitability AS (
                SELECT *,
                    CASE
                        WHEN created_at IN latest_two_months THEN 1
                        ELSE 0
                    END AS in_latest_two_months,
                    ROW_NUMBER() OVER (ORDER BY created_at DESC) AS recency
                FROM posts
            )
            SELECT
                id,
                author,
                created_at,
                json(content) as content
            FROM suitability
            WHERE in_latest_two_months = 1
               OR recency <= 20
            ORDER BY created_at DESC;
        `).all();

        return rawPosts.map(post => ({
            id: post.id,
            author: post.author,
            createdAt: post.created_at,
            ...JSON.parse(post.content)
        }));
    }

    createPost(post) {
        const insertPost = this.db.prepare('INSERT INTO posts (id, author, created_at, content) VALUES (?, ?, ?, jsonb(?));');

        const content = {...post};
        delete content.id;
        delete content.author;
        delete content.createdAt;
        insertPost.run(post.id, post.author, post.createdAt, JSON.stringify(content));
    }
}

export default SqliteDatabase;
