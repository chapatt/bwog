import {Hono} from 'hono';

import NodeFsStore from './stores/NodeFsStore.js';
import JsonDatabase from './databases/JsonDatabase.js';
import SqliteDatabase from './databases/SqliteDatabase.js';
import router from './router';

const app = new Hono();
const store = new NodeFsStore(process.env['PUBLIC_PATH']);
let database;
switch (process.env['DATABASE_TYPE']) {
    case 'JSON':
        database = new JsonDatabase(process.env['DATABASE_FILE']);
        break;
    case 'SQLITE':
        database = new SqliteDatabase(process.env['DATABASE_FILE']);
        break;
}

app.use((c, next) => {
    c.set('store', store);
    c.set('database', database);

    return next();
});

app.route('/', router);

export default app;
