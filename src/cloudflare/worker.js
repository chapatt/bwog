import {Hono} from 'hono';

import R2Store from '../stores/R2Store.js';
import DurableObjectDatabase from '../databases/DurableObjectDatabase.js';
import router from '../router';

const app = new Hono();
const store = new R2Store(c.env.STORE);
const stub = c.env.DATABASE.getByName('blog-posts');
const database = new DurableObjectDatabase(stub);

app.use((c, next) => {
    c.set('store', store);
    c.set('database', database);

    return next();
});

app.route('/', router);

export { default as Database } from './Database.js';
export default app;
