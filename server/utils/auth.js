module.exports = {
    resolveUserHeader(raw) {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        return JSON.parse(decoded);
    }
}