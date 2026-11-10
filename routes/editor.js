import express from 'express';

import Controller from '../controller.js';
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

    const store = new NodeFsStore();
    let database;
    switch (inputType) {
    case 'JSON':
        database = new JsonDatabase(process.env['DATABSE_FILE']);
        break;
    case 'SQLITE':
        database = new SqliteDatabase(process.env['DATABSE_FILE']);
        break;
    }
    await database.connect();

    const controller = new Controller(store, database);
    await controller.createPost(req.body, req.user);
    res.redirect('/');
});

export default router;
