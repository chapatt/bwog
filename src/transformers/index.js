import builtin from './builtin/index.js';
import config from '../config.js';

export function handler(type, content) {
    const transformer = config?.transformers?.[type] ?? builtin?.[type];

    if (!transformer) {
        throw new Error(`Cannot find transformer for type: '${type}''`);
    }

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

    return content;
}
