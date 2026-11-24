import builtin from './builtin/index.js';
import config from '../config.js';

export function handler(type, content) {
    const transformer = config?.transformers?.[type] ?? builtin?.[type];

    if (!transformer) {
        throw new Error(`Cannot find transformer for type: '${type}''`);
    }

    if (transformer.schema) {
        content = transformer.schema.parse(content);
    }

    if (transformer.handler) {
        content = transformer.handler(content);
    }

    return content;
}
