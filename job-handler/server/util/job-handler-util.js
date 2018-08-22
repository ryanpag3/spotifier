const logger = require('logger');
module.exports = {
    getBackoff: (attempt) => {
        let base = 100;
        let max = 5000;
        for (let i = 1; i < attempt; i++) {
            base =+ base * i;
            if (base > max)
                base = max;
        };
        return base;
    }
};