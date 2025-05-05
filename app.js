const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const authRouter = require('./routes/auth');
const editorRouter = require('./routes/editor');

const app = express();
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));
app.use('/', authRouter);
app.use('/', editorRouter);
app.listen(80);