const path = require('path');
const {program} = require('commander');

const Generator = require(path.resolve(__dirname, 'generator.js'));

program.description('Generate blog');
program.requiredOption('-i, --input <string>', 'content JSON');
program.requiredOption('-o, --output <string>', 'output directory');
program.parse();
const options = program.opts();
const input = path.resolve(options.input);
const outputDir = path.resolve(options.output);

const posts = require(input);

const generator = new Generator();
generator.generate(posts, outputDir);
