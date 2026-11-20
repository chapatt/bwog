import fs from 'node:fs/promises';
import { Eta } from 'eta';

const eta = new Eta();

export const etaLoader = {
    name: 'eta-loader',
    setup(build) {
        build.onLoad({ filter: /\.eta$/ }, async (args) => {
            const rawTemplate = await fs.readFile(args.path, 'utf8');

            const compiled = eta.compileToString(rawTemplate);

            return {
                contents: `export default function (it, options) {${compiled}}`,
                loader: 'js',
            };
        });
    },
};