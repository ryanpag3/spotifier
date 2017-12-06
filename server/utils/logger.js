const winston = require('winston');

const tsFormat = () => ( new Date() ).toLocaleDateString() + ' - ' + ( new Date() ).toLocaleTimeString();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error'}),
        new winston.transports.File({ filename: 'logs/info.log', level: 'info'}),
        new winston.transports.File({ filename: 'logs/debug.log', level: 'debug'}),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (!process.env.NODE_ENV) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
        'timestamp':true
    }));
}

module.exports = logger;