import fs from 'fs';
import path from 'path';

class NodeFsStore {
    constructor(outputDir) {
        this.outputDir = outputDir;
    }

    async write(file, data, mimeType) {
        let buffer = data;
        if (data instanceof File) {
            buffer = Buffer.from(await data.arrayBuffer());
        }
        fs.writeFileSync(path.resolve(this.outputDir, `${file}${mimeType === 'text/html' ? '.html' : ''}`), buffer);
    }
}

export default NodeFsStore;
