class R2Store {
    constructor(outputDir) {
        this.outputDir = outputDir;
    }

    async write(file, data, mimeType) {
        await this.outputDir.put(file, data, mimeType && {httpMetadata: {contentType: mimeType}});
    }
}

export default R2Store;
