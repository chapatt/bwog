import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Eta } from 'eta';

let templates = 'export default {';

const eta = new Eta();

const templatePaths = readdirSync('./views', { withFileTypes: true })
    .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.eta')
    .map(entry => entry.name);

templatePaths.forEach(templatePath => {
    const templateFunction = eta.compile(readFileSync(path.join('./views', templatePath), 'utf8'));
    templates += `${templatePath.split('.')[0]}: ${templateFunction.toString()},`;
})

templates += '};';


writeFileSync('templates.js', templates, 'utf8');
