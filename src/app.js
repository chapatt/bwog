import express from 'express';
import session from 'express-session';
import passport from 'passport';
import 'dotenv/config';

import authRouter from './routes/auth.js';
import editorRouter from './routes/editor.js';

const app = express();
app.use(session({
    secret: process.env['SESSION_SECRET'],
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));
app.use(express.urlencoded({type: 'application/x-www-form-urlencoded'}));
app.use('/', authRouter);
app.use('/', editorRouter);

export default app;
