import fs from 'fs';
import path from 'path';

class NodeFsStore {
    constructor(outputDir) {
        this.outputDir = outputDir;
    }

    async write(file, data) {
        fs.writeFileSync(path.resolve(this.outputDir, file), data);
    }
}

export default NodeFsStore;
