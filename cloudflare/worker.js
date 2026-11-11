import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { csrf } from 'hono/csrf';
import { setCookie, deleteCookie } from 'hono/cookie';
import { googleAuth } from '@hono/oauth-providers/google';

import R2Store from '../stores/R2Store.js';
import DurableObjectDatabase from '../databases/DurableObjectDatabase.js';
import Controller from '../controller.js';

const app = new Hono();

app.use(csrf());

app.use('/login', c => googleAuth({
    client_id: c.env.GOOGLE_ID,
    client_secret: c.env.GOOGLE_SECRET,
    scope: ['email'],
}));

app.get('/login', async c => {
    const expirationSeconds = 60 * 60 * 24 * 7;
    const user = c.get('user-google');

    if (user.id !== c.env.GOOGLE_OAUTH_AUTHORIZED_USER_ID) {
        deleteCookie(c, 'auth_token');
        return c.redirect('/');
    }

    const payload = {
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    }

    const jwtToken = await sign(payload, c.env.JWT_SECRET, 'HS256');

    setCookie(c, 'auth_token', jwtToken, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: expirationSeconds,
    })

    return c.redirect('/');
});

app.use('/post', c => jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',
    cookie: 'auth_token',
}))

app.post('/post', async c => {
    const userDisplayName = c.json(c.get('jwtPayload')).name;
    const stub = c.env.DATABASE.getByName('music-blog');
    const store = new R2Store();
    const database = new DurableObjectDatabase(stub);
    const controller = new Controller(store, database);

    await controller.createPost(c.request.body, userDisplayName);

    return c.redirect('/');
});

export { default as Database } from './Database.js';
export default app;
