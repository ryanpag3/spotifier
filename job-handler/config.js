const config = {
    production: {

    },
    development: {
        server: {
            port: 4000
        }
    }
};
module.exports = config[require('./environment')];