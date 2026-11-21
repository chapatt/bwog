import { Eta } from 'eta';

import builtin from './builtin';
import config from '../config.js';
import atom_feed from './system/atom_feed.eta';
import sitemap from './system/sitemap.eta';

const eta = new Eta();

export function renderPost(type, medium, data) {
    const view = config?.views?.[type]?.[medium] ?? builtin?.[type]?.[medium];

    if (!view) {
        throw new Error(`Cannot find template for type: '${type}', medium '${medium}'`);
    }

    return view.template.call(eta, {post: view.handler(data)});
}

export function renderLayout(data) {
    const view = config?.views?.layout ?? builtin.layout;

    eta.loadTemplate("@post", (it, options) => renderPost(it.post.type, 'web', it.post));

    return view.template.call(eta, view.handler(data));
}

export function renderAtom(data) {
    return atom_feed.call(eta, data);
}

export function renderSitemap(data) {
    return sitemap.call(eta, data);
}
