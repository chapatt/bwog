import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { csrf } from 'hono/csrf';
import { setCookie, deleteCookie } from 'hono/cookie';
import { googleAuth } from '@hono/oauth-providers/google';

import { handler } from './transformers';
import Controller from './Controller.js';
import Generator from './Generator.js';

const app = new Hono();

app.use(csrf());

if (__DEV__) {
    app.use('/login', (c, next) => {
        c.set('user-google', {
            name: c.env.AUTHOR_NAME,
            id: c.env.GOOGLE_OAUTH_AUTHORIZED_USER_ID,
        });
        return next();
    });
} else {
    app.use('/login', (c, next) => googleAuth({
        client_id: c.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: c.env.GOOGLE_OAUTH_CLIENT_SECRET,
        scope: ['email', 'profile'],
    })(c, next));
}

app.get('/login', async c => {
    const expirationSeconds = 60 * 60 * 24 * 7;
    const user = c.get('user-google');

    if (user.id !== c.env.GOOGLE_OAUTH_AUTHORIZED_USER_ID) {
        deleteCookie(c, 'authToken');
        deleteCookie(c, 'isAuthed');

        return c.redirect('/');
    }

    const payload = {
        sub: user,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    }

    const jwtToken = await sign(payload, c.env.JWT_SECRET, 'HS256');

    setCookie(c, 'authToken', jwtToken, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: expirationSeconds,
    });
    setCookie(c, 'isAuthed', true, {
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'Strict',
        maxAge: expirationSeconds,
    });

    return c.redirect('/');
});

app.get('/logout', c => {
    deleteCookie(c, 'authToken');
    deleteCookie(c, 'isAuthed');

    return c.redirect('/');
});

app.use((c, next) => {
    if (__DEV__) {
        c.set('jwtPayload', {sub: {name: c.env.AUTHOR_NAME}});
        return next();
    } else {
        return jwt({
            secret: c.env.JWT_SECRET,
            alg: 'HS256',
            cookie: 'authToken',
        })(c, next)
    }
});

app.post('/post', async c => {
    let content;
    if (!c.req.query('type')) {
        c.status(400);
        return c.text("Bad Request: 'type' parameter required.");
    }
    try {
        content = handler(c.req.query('type'), await c.req.parseBody());
    } catch (error) {
        c.status(400);
        return c.text(error.message);
    }

    const user = c.var.jwtPayload.sub;
    const controller = new Controller(c.var.store, c.var.database);

    try {
        await controller.createPost(content, user);
    } catch(error) {
        c.status(400);
        return c.text("Bad Request: post could not be processed.");
    }

    return c.redirect('/');
});

app.get('/setup', async c => {
    const generator = new Generator(c.var.store, c.var.database);

    await c.var.database.initSchema();

    if (c.req.query('import') !== undefined) {
        const postsFile = await c.env.PRIVATE_BUCKET.get('posts.json');
        const posts = await postsFile.json();
        await c.var.database.importPosts(posts);
    }

    await generator.generate(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], false);

    return c.redirect('/');
});

app.get('/generate', async c => {
    const generator = new Generator(c.var.store, c.var.database);

    await generator.generate(`https://${process.env['SITE_DOMAIN']}`, process.env['AUTHOR_NAME'], process.env['AUTHOR_EMAIL'], false);

    return c.redirect('/');
});

if (__DEV__) {
    app.get('/*', async c => {
        const path = c.req.path === '/' ? 'index' : c.req.path.slice(1);
        const object = await c.env.STORE.get(path);
        c.header('Content-Type', object.httpMetadata.contentType);
        return c.body(object.body);
    });
}

export default app;
