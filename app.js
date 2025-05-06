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
app.use(express.urlencoded({type: "application/x-www-form-urlencoded"}));
app.use('/', authRouter);
app.use('/', editorRouter);
app.listen(3000, error => {
    if (error) {
        console.error(error);
    } else {
        console.log('listening');
    }
});