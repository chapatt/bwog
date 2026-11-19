#!/usr/bin/env node

import { resolve } from 'node:path';
import * as esbuild from 'esbuild';
import { program, Option } from 'commander';

program
    .description('bwog command line utility');

program.command('build')
    .description('build required files for deployment')
    .addOption(new Option('-t, --template <string>', 'type of deployment: cloudflare workers or a traditional web server.').choices(['cloudflare-worker', 'vps']).makeOptionMandatory())
    .action(async (options) => {
        if (options.type === 'cloudflare-worker') {
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, './cloudflare/worker.js')],
                outfile: './dist/worker.js',
                bundle: true,
                format: 'esm',
                platform: 'browser',
                target: 'es2022',
                conditions: ['workerd', 'worker', 'browser'],
                external: ['cloudflare:*', 'node:*', 'url', 'fs', 'path', 'os', 'child_process'],
                minify: process.env.NODE_ENV === 'production',
                sourcemap: true,
                loader: {},
                plugins: [],
            });
        } else {
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, './app.js')],
                outfile: './dist/app.js',
                bundle: true,
                format: 'esm',
                platform: 'node',
                target: 'node22',
                minify: process.env.NODE_ENV === 'production',
                sourcemap: true,
                loader: {},
                plugins: [],
            });
        }
    });

program.command('run')
    .description('start web server')
    .option('-p, --port <number>', 'port on which to listen for requests', '3000')
    .action(({port}) => {
        const app = import(resolve(process.cwd(), './dist/app.js'));
        app.listen(port);
        console.log('listening');
    });

program.parse();
