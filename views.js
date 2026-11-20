import { Eta } from 'eta';

import config from './config.js';

const eta = new Eta();

export function renderPost(type, medium, data) {
    console.log(config.views);
    console.log(type);
    console.log(config.views[type]);
    console.log(config.views[type][medium]);
    const view = config.views[type][medium];

    view.template.default.call(eta, view.handler(data));
}

export function renderLayout(data) {
    const view = config.views.layout;

    eta.loadTemplate("@post", (it, options) => renderPost(it.post.type, 'web', it.post));

    return view.template.default.call(eta, view.handler(data));
}
