import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const config = await import('@bwog.config')
    .catch(async () => {
        return await import(pathToFileURL(resolve(process.cwd(), process.env.BWOG_CONFIG || './bwog.config.js')));
    })
    .catch(() => {
        throw new Error('Could not locate bwog config file at esbuild alias, BWOG_ENV, or ./bwog.config.js');
    });

export default config.default;
