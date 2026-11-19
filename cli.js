#!/usr/bin/env node

import { program } from 'commander';

import app from './app.js';

program
    .description('bwog command line utility');

program.command('build')
    .description('build required files for deployment')
    .action(() => {
    });

program.command('run')
    .description('start web server')
    .option('-p, --port <number>', 'port on which to listen for requests', '3000')
    .action(({port}) => {
        app.listen(port);
        console.log('listening');
    });

program.parse();
