#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from 'node:process';
import * as esbuild from 'esbuild';
import { program, Option } from 'commander';
import { serve } from '@hono/node-server';

import { etaLoader } from '../src/templateLoaders/etaLoader.js';

program.description('bwog command line utility');

program.command('build')
    .description('build required files for deployment')
    .addOption(new Option('-t, --deployment_type <string>', 'type of deployment: cloudflare workers or a traditional web server.').choices(['cloudflare-worker', 'vps']).makeOptionMandatory())
    .option('-d, --dev', 'development build')
    .action(async (options) => {
        if (process.env.WRANGLER_COMMAND === 'dev') {
            options.dev = true;
        }
        switch (options.deployment_type) {
        case 'cloudflare-worker':
            console.log('Building for cloudflare-worker');
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, '../src/cloudflare/worker.js')],
                outfile: './dist/worker.js',
                alias: {
                    '@bwog.config': './bwog.config.js',
                },
                nodePaths: [resolve(import.meta.dirname, '../node_modules')],
                bundle: true,
                format: 'esm',
                platform: 'browser',
                target: 'es2022',
                conditions: ['workerd', 'worker', 'browser'],
                external: ['cloudflare:*', 'node:*', 'url', 'fs', 'path', 'os', 'child_process'],
                define: {
                    '__DEV__': options.dev ? 'true' : 'false',
                    '__DEPLOYMENT_TYPE__': `'${options.deployment_type}'`,
                },
                minify: !options.dev,
                sourcemap: true,
                loader: {},
                plugins: [etaLoader],
                logOverride: {
                    'empty-glob': 'silent',
                },
            });
            break;
        case 'vps':
            console.log('Building for vps');
            await esbuild.build({
                entryPoints: [resolve(import.meta.dirname, '../src/app.js')],
                outfile: './dist/app.js',
                alias: {
                    '@bwog.config': './bwog.config.js',
                },
                nodePaths: [resolve(import.meta.dirname, '../node_modules')],
                bundle: true,
                format: 'esm',
                platform: 'node',
                target: 'node22',
                define: {
                    '__DEV__': options.dev ? 'true' : 'false',
                    '__DEPLOYMENT_TYPE__': `'${options.deployment_type}'`,
                },
                minify: !options.dev,
                sourcemap: true,
                loader: {},
                plugins: [etaLoader],
                logOverride: {
                    'empty-glob': 'silent',
                },
            });
            break;
        }
    });

program.command('serve')
    .description('start web server')
    .option('-p, --port <number>', 'port on which to listen for requests', '3000')
    .action(async ({port}) => {
        loadEnvFile();
        const { default: app } = await import(pathToFileURL(resolve(process.cwd(), './dist/app.js')));

        serve({
            fetch: app.fetch,
            port: parseInt(port),
        }, info => {
            console.log(`listening on port ${info.port}`);
        })
    });

program.parse();
