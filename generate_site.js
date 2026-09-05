import path from 'path';
import { program } from 'commander';
import { pathToFileURL } from 'url';

import Generator from './generator.js';

program.description('Generate blog');
program.requiredOption('-u, --url <string>', 'site URL, e.g. https://example.com');
program.requiredOption('-i, --input <string>', 'content JSON');
program.requiredOption('-o, --output <string>', 'output directory');
program.parse();
const options = program.opts();
const siteUrl = options.url;
const input = pathToFileURL(path.resolve(options.input)).href;
const outputDir = path.resolve(options.output);

const posts = await import(input, {with: {type: 'json'}});

const generator = new Generator();
generator.generate(siteUrl, outputDir, posts);
