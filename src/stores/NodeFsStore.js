import fs from 'fs';
import path from 'path';

class NodeFsStore {
    constructor(outputDir) {
        this.outputDir = outputDir;
    }

    async write(file, data, mimeType) {
        fs.writeFileSync(path.resolve(this.outputDir, `${file}${mimeType === 'text/html' ? '.html' : ''}`), data);
    }
}

export default NodeFsStore;
