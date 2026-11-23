import express from 'express';

import { handler } from '../transformers/index.js';
import Controller from '../Controller.js';
import NodeFsStore from '../stores/NodeFsStore.js';
import JsonDatabase from '../databases/JsonDatabase.js';
import SqliteDatabase from '../databases/SqliteDatabase.js';

const router = express.Router();

router.post('/post', async (req, res) => {
    if (!req.isAuthenticated()) {
        req.session.pendingPost = req.body;
        res.redirect('/login');
        return;
    }

    let content;
    if (!req.query.type) {
        res.status(400).send("Bad Request: 'type' parameter required.");
    }
    try {
        content = handler(req.query.type, req.body);
    } catch (error) {
        res.status(400).send(error.message);
    }

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
    await database.connect();

    const controller = new Controller(store, database);
    await controller.createPost(content, req.user);
    res.redirect('/');
});

export default router;
