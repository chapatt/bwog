#!/usr/bin/env node

import { resolve } from 'node:path';
import * as esbuild from 'esbuild';
import { program, Option } from 'commander';

import { etaLoader } from './templateLoaders/etaLoader.js';

program.description('bwog command line utility');

program.command('build')
    .description('build required files for deployment')
    .addOption(new Option('-t, --deployment_type <string>', 'type of deployment: cloudflare workers or a traditional web server.').choices(['cloudflare-worker', 'vps']).makeOptionMandatory())
    .action(async (options) => {
        switch (options.deployment_type) {
        case 'cloudflare-worker':
            console.log('Building for Cloudflare Worker');
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, './cloudflare/worker.js')],
                outfile: './dist/worker.js',
                alias: {
                    '@bwog.config': './bwog.config.js',
                },
                nodePaths: [resolve(import.meta.dirname, './node_modules')],
                bundle: true,
                format: 'esm',
                platform: 'browser',
                target: 'es2022',
                conditions: ['workerd', 'worker', 'browser'],
                external: ['cloudflare:*', 'node:*', 'url', 'fs', 'path', 'os', 'child_process'],
                minify: process.env.NODE_ENV === 'production',
                sourcemap: true,
                loader: {},
                plugins: [etaLoader],
                logOverride: {
                    'empty-glob': 'silent',
                },
            });
            break;
        case 'vps':
            console.log('Building for VPS');
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, './app.js')],
                outfile: './dist/app.js',
                alias: {
                    '@bwog.config': './bwog.config.js',
                },
                nodePaths: [resolve(import.meta.dirname, './node_modules')],
                bundle: true,
                format: 'esm',
                platform: 'node',
                target: 'node22',
                minify: process.env.NODE_ENV === 'production',
                sourcemap: true,
                loader: {},
                plugins: [],
                logOverride: {
                    'empty-glob': 'silent',
                },
            });
            break;
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
