import fs from 'fs';
import path from 'path';
import { program, Option } from 'commander';
import { pathToFileURL } from 'url';

import Generator from './generator.js';
import NodeFsStore from './stores/NodeFsStore.js';
import JsonDatabase from './databases/JsonDatabase.js';
import SqliteDatabase from './databases/SqliteDatabase.js';

program
    .description('Generate blog')
    .requiredOption('-u, --url <string>', 'site URL, e.g. https://example.com')
    .addOption(new Option('-t, --input_type <string>', 'database type').choices(['JSON', 'SQLITE']).makeOptionMandatory())
    .requiredOption('-i, --input <string>', 'database file, e.g. ./blog.json')
    .requiredOption('-o, --output <string>', 'output directory')
    .requiredOption('-n, --name <string>', 'author display name')
    .requiredOption('-e, --email <string>', 'author email address')
    .option('-l, --enable_ap <boolean>', 'If ActivityPub files should be generated', false)
    .option('-a, --ap_handle <string>', 'ActivityPub handle, e.g. author@example.com')
    .option('-m, --ap_username <string>', 'ActivityPub username, e.g. author')
    .option('-k, --ap_public_key <string>', 'ActivityPub public key path, e.g. ./public.pem')
program.parse();
const options = program.opts();
const siteUrl = options.url;
const inputType = options.input_type;
const input = pathToFileURL(path.resolve(options.input)).href;
const outputDir = path.resolve(options.output);
const authorName = options.name;
const authorEmail = options.email;
const enableAP = !!options.enable_ap;
const apHandle = options.ap_handle;
const apUsername = options.ap_username;
const apPublicKey = fs.readFileSync(options.ap_public_key, 'utf8').replaceAll('\r\n', '\n').trimEnd();
if (enableAP && !(apHandle && apUsername && apPublicKey)) {
    program.error("error: '--ap_*' options are required when '--enable_ap=true'");
}

if (enableAP) {
    fs.mkdirSync(path.resolve(outputDir, 'ap/notes'), {recursive: true});
    fs.mkdirSync(path.resolve(outputDir, 'ap/creates'), {recursive: true});
    fs.mkdirSync(path.resolve(outputDir, 'ap/outbox_pages'), {recursive: true});
}

let database;
switch (inputType) {
    case 'JSON':
        database = new JsonDatabase(input);
        break;
    case 'SQLITE':
        database = new SqliteDatabase(input);
        break;
}
await database.connect();

const store = new NodeFsStore(outputDir);
const generator = new Generator(store, database);
await generator.generate(siteUrl, authorName, authorEmail, enableAP, apHandle, apUsername, apPublicKey);
