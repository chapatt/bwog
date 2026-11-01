import express from 'express';

import Controller from '../controller.js';
import NodeFsStore from '../stores/nodeFsStore.js';
import JsonDatabase from '../database/JsonDatabase.js';

const router = express.Router();

router.post('/post', async (req, res) => {
    if (!req.isAuthenticated()) {
        req.session.pendingPost = req.body;
        res.redirect('/login');
        return;
    }

    const store = new NodeFsStore();
    const database = new JsonDatabase(process.env['SOURCE_JSON']);
    await database.connect();

    const controller = new Controller(store, database);
    await controller.createPost(req.body, req.user);
    res.redirect('/');
});

export default router;
