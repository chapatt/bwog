import config from './config.js';

export function handler(type, content) {
    const transformer = config.transformers[type];

    if (transformer) {
        if (transformer.schema) {
            try {
                content = transformer.schema.parse(content);
            } catch (error) {
                throw new Error('Bad Request: Invalid post.');
            }
        }

        if (transformer.handler) {
            try {
                content = transformer.handler(content);
            } catch (error) {
                throw new Error('Bad Request: Invalid post.');
            }
        }
    } else {
        throw new Error('Bad Request: Invalid post type.');
    }

    return content;
}
