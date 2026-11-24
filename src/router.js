import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { csrf } from 'hono/csrf';
import { setCookie, deleteCookie } from 'hono/cookie';
import { env } from 'hono/adapter';
import { googleAuth } from '@hono/oauth-providers/google';
import { serveStatic } from "@hono/node-server/serve-static";

import { handler } from './transformers';
import Controller from './Controller.js';
import Generator from './Generator.js';

const app = new Hono();

app.use(csrf());

if (__DEV__) {
    app.use('/login', (c, next) => {
        c.set('user-google', {
            name: env(c).AUTHOR_NAME,
            id: env(c).GOOGLE_OAUTH_AUTHORIZED_USER_ID,
        });
        return next();
    });
} else {
    app.use('/login', (c, next) => googleAuth({
        client_id: env(c).GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env(c).GOOGLE_OAUTH_CLIENT_SECRET,
        scope: ['email', 'profile'],
    })(c, next));
}

app.get('/login', async c => {
    const expirationSeconds = 60 * 60 * 24 * 7;
    const user = c.get('user-google');

    if (user.id !== env(c).GOOGLE_OAUTH_AUTHORIZED_USER_ID) {
        deleteCookie(c, 'authToken');
        deleteCookie(c, 'isAuthed');

        return c.redirect('/');
    }

    const payload = {
        sub: user,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    }

    const jwtToken = await sign(payload, env(c).JWT_SECRET, 'HS256');

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
        c.set('jwtPayload', {sub: {name: env(c).AUTHOR_NAME}});
        return next();
    } else {
        return jwt({
            secret: env(c).JWT_SECRET,
            alg: 'HS256',
            cookie: 'authToken',
        })(c, next)
    }
});

app.post('/post', async c => {
    if (!c.req.query('type')) {
        c.status(400);
        return c.text("Bad Request: 'type' parameter required.");
    }

    const content = handler(c.req.query('type'), await c.req.parseBody());

    const user = c.var.jwtPayload.sub;
    const controller = new Controller(c.var.store, c.var.database);

    await controller.createPost(content, user);

    return c.redirect('/');
});

app.get('/setup', async c => {
    const generator = new Generator(c.var.store, c.var.database);

    await c.var.database.initSchema();

    if (c.req.query('import') !== undefined) {
        const postsFile = await env(c).PRIVATE_BUCKET.get('posts.json');
        const posts = await postsFile.json();
        await c.var.database.importPosts(posts);
    }

    await generator.generate(`https://${env(c).SITE_DOMAIN}`, env(c).AUTHOR_NAME, env(c).AUTHOR_EMAIL, false);

    return c.redirect('/');
});

app.get('/generate', async c => {
    const generator = new Generator(c.var.store, c.var.database);

    await generator.generate(`https://${env(c).SITE_DOMAIN}`, env(c).AUTHOR_NAME, env(c).AUTHOR_EMAIL, false);

    return c.redirect('/');
});

if (__DEV__) {
    if (__DEPLOYMENT_TYPE__ === 'cloudflare-worker') {
        app.get('/*', async c => {
            const path = c.req.path === '/' ? 'index' : c.req.path.slice(1);
            const object = await env(c).STORE.get(path);
            c.header('Content-Type', object.httpMetadata.contentType);
            return c.body(object.body);
        });
    }

    if (__DEPLOYMENT_TYPE__ === 'vps') {
        app.use('/*', (c, next) => serveStatic({root: env(c).PUBLIC_PATH})(c, next));
    }
}

export default app;
