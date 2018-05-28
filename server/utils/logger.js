var log = require('bristol');
var path = require('path');

log.addTransform(function(elem) {
    /**
     * {
     *  "file" : "path/to/file",
     *  "line" : "linenumber"
     * }
     */
    if (elem)
        delete elem.file;
    if (elem)
        delete elem.line;
    return null;
})
log.addTarget('console').withFormatter('human');
log.addTarget('file', {file: path.join(__dirname, '../../logs/log.json')}).withFormatter('json');
log.addTarget('file', {file: path.join(__dirname, '../../logs/human.log')}).withFormatter('human');


module.exports = log;