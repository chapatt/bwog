import transformers from './transformers/index.js';
import views from './views/index.js';

export default {
    beautifyHtml: true,
    deploymentType: 'cloudflare-worker',
    views,
    transformers,
};
