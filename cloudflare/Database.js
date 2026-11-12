import { DurableObject } from 'cloudflare:workers'

class Database extends DurableObject {
    constructor(ctx, env) {
        super(ctx, env);

        this.db = ctx.storage.sql;
    }

    initSchema(posts) {
        this.db.exec(`CREATE TABLE posts (
            id TEXT PRIMARY KEY,
            author TEXT  NOT NULL,
            created_at TEXT  NOT NULL,
            content JSONB NOT NULL
        );`);
    }

    importPosts(posts) {
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

    getAll() {
        const rawPosts = this.db.exec(`
            SELECT
                id,
                author,
                created_at,
                json(content) as content
            FROM posts
            ORDER BY created_at DESC;
        `).toArray();

        return rawPosts.map(post => ({
            id: post.id,
            author: post.author,
            createdAt: post.created_at,
            ...JSON.parse(post.content)
        }));
    }

    getLastTwoMonthsAtLeast20() {
        const rawPosts = this.db.exec(`
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
        `).toArray();

        return rawPosts.map(post => ({
            id: post.id,
            author: post.author,
            createdAt: post.created_at,
            ...JSON.parse(post.content)
        }));
    }

    createPost(post) {
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
    }
}

export default Database;
