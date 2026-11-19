import { resolve } from 'node:path';

const config = await import('@bwog.config')
    .catch(async () => {
        return await import(resolve(process.cwd(), process.env.BWOG_CONFIG || './bwog.config.js'));
    })
    .catch(() => {
        throw new Error('Could not locate bwog config file at esbuild alias, BWOG_ENV, or ./bwog.config.js');
    })

export const transformers = resolve(process.cwd(), config.transformers);