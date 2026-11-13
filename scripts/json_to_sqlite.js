import JsonDatabase from '../databases/JsonDatabase.js';
import SqliteDatabase from '../databases/SqliteDatabase.js';
import { program } from 'commander';
import {pathToFileURL} from "url";
import path from "path";

program.description('Generate blog');
program.requiredOption('-j, --json <string>', 'json file, e.g. ./posts.json');
program.requiredOption('-s, --sqlite <string>', 'sqlite file, e.g. ./posts.sqlite');
program.parse();
const options = program.opts();
const jsonFile = pathToFileURL(path.resolve(options.json)).href;
const sqliteFile = pathToFileURL(path.resolve(options.sqlite)).href;

const jsonDatabase = new JsonDatabase(jsonFile);
await jsonDatabase.connect();

const sqliteDatabase = new SqliteDatabase(sqliteFile);
await sqliteDatabase.connect();
await sqliteDatabase.makeFromJsonDatabase(jsonDatabase);
