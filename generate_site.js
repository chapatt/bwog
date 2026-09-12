import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import { pathToFileURL } from 'url';

import Generator from './generator.js';

program.description('Generate blog');
program.requiredOption('-u, --url <string>', 'site URL, e.g. https://example.com');
program.requiredOption('-i, --input <string>', 'content JSON');
program.requiredOption('-o, --output <string>', 'output directory');
program.requiredOption('-n, --name <string>', 'author display name');
program.requiredOption('-e, --email <string>', 'author email address');
program.requiredOption('-a, --ap_handle <string>', 'ActivityPub handle, e.g. author@example.com');
program.requiredOption('-m, --ap_username <string>', 'ActivityPub username, e.g. author');
program.requiredOption('-k, --ap_public_key <string>', 'ActivityPub public key path, e.g. ./public.pem');
program.parse();
const options = program.opts();
const siteUrl = options.url;
const input = pathToFileURL(path.resolve(options.input)).href;
const outputDir = path.resolve(options.output);
const authorName = options.name;
const authorEmail = options.email;
const apHandle = options.ap_handle;
const apUsername = options.ap_username;
const apPublicKey = fs.readFileSync(options.ap_public_key, 'utf8').replaceAll('\r\n', '\n').trimEnd();

const { default: posts } = await import(input, {with: {type: 'json'}});

const generator = new Generator();
generator.generate(siteUrl, outputDir, authorName, authorEmail, apHandle, apUsername, apPublicKey, posts);
