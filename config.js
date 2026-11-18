import { resolve } from 'node:path';

const config = await import('@bwog.config')
    .catch(async () => {
        if (process.env.BWOG_CONFIG) {
            return await import(resolve(process.cwd(), process.env.BWOG_ENV));
        }
    })
    .catch(async () => {
        return await import(resolve(process.cwd(), './bwog.config.js'));
    })
    .catch(() => {
        throw new Error('Could not locate bwog config file at esbuild alias, BWOG_ENV, or working directory');
    })

export default config;