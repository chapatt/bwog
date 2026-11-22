import { Eta } from 'eta';

import builtin from './builtin/index.js';
import config from '../config.js';
import atom_feed from './system/atom_feed.eta';
import sitemap from './system/sitemap.eta';

const eta = new Eta();

export function renderPost(type, medium, data) {
    const view = config?.views?.[type]?.[medium] ?? builtin?.[type]?.[medium];

    if (!view) {
        throw new Error(`Cannot find view for type: '${type}', medium '${medium}'`);
    }

    if (!(typeof view.handler === 'function' || typeof view.template === 'function')) {
        throw new Error(`View for type: '${type}', medium '${medium}' has neither template nor handler`);
    }

    data = typeof view.handler === 'function' ? view.handler(data) : data;
    return typeof view.template === 'function' ? view.template.call(eta, {post: data}) : data;
}

export function renderLayout(data) {
    data.posts = data.posts.map(post => !post.attachments
        ? post
        : {
            ...post,
            attachments: Object.entries(post.attachments).reduce((attachments, [key, value], i) => {
                attachments[key] = `/cdn/${value}`;
                return attachments;
            }, {})
        }
    );

    const view = config?.views?.layout ?? builtin.layout;

    if (!(typeof view.handler === 'function' || typeof view.template === 'function')) {
        throw new Error(`Layout view has neither template nor handler`);
    }

    eta.loadTemplate("@post", (it, options) => renderPost(it.post.type, 'web', it.post));

    data = typeof view.handler === 'function' ? view.handler(data) : data;
    return typeof view.template === 'function' ? view.template.call(eta, data) : data;
}

export function renderAtom(data) {
    return atom_feed.call(eta, data);
}

export function renderSitemap(data) {
    return sitemap.call(eta, data);
}
