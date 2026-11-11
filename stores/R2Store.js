class R2Store {
    constructor(outputDir) {
        this.outputDir = outputDir;
    }

    async write(file, data) {
        await this.outputDir.put(file, data);
    }
}

export default R2Store;
