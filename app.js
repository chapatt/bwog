import path from 'path';
import dotenv from 'dotenv';
dotenv.config({path: path.resolve(__dirname, '.env')});
import express from 'express';
import session from 'express-session';
import passport from 'passport';

import authRouter from './routes/auth';
import editorRouter from './routes/editor';

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
app.listen(3000, error => {
    if (error) {
        console.error(error);
    } else {
        console.log('listening');
    }
});