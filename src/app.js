import { resolve } from 'node:path';
import { pathToFileURL } from 'url';
import { Hono } from 'hono';

import NodeFsStore from './stores/NodeFsStore.js';
import JsonDatabase from './databases/JsonDatabase.js';
import SqliteDatabase from './databases/SqliteDatabase.js';
import router from './router';

const app = new Hono();
const store = new NodeFsStore(resolve(process.cwd(), process.env['PUBLIC_PATH']));
let database;
switch (process.env['DATABASE_TYPE']) {
    case 'JSON':
        database = new JsonDatabase(pathToFileURL(resolve(process.cwd(), process.env['DATABASE_FILE'])));
        break;
    case 'SQLITE':
        database = new SqliteDatabase(resolve(process.cwd(), process.env['DATABASE_FILE']));
        break;
}
await database.connect();

app.use((c, next) => {
    c.set('store', store);
    c.set('database', database);

    return next();
});

app.route('/', router);

export default app;
