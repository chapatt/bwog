import { resolve } from 'node:path';

let config = {};

config = import('bwog.config')
    .catch(async () => {
        config = await import(resolve(process.cwd(), './bwog.config.js'));
    })
    .catch(() => {
        throw new Error('Could not locate bwog config file at alias or working directory');
    })

export default config;