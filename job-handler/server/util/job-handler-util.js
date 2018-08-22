const logger = require('logger');
module.exports = {
    getBackoff: (attempt) => {
        let base = 50;
        let max = 10000;
        for (let i = 1; i < attempt; i++) {
            base =+ base * i;
            if (base > max)
                base = max;
        };
        return base;
    }
};