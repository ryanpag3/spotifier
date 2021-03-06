const logger = require('./logger');

function PerformanceStats(job) {
    this.job = job;
    this.start;
    this.end;
    this.millis;
    this.seconds;
    this.minutes;
    this.hours;
    this.days;
}

PerformanceStats.prototype.start = function() {
    this.start = new Date();
}

PerformanceStats.prototype.end = function() {
    this.end = new Date();
}

PerformanceStats.prototype.finish = function() {
    this.end();
    this.millis = this.end.getTime() - this.start.getTime();

    if (this.millis > 1000)
        this.seconds = this.millis / 1000;
    
    if (this.seconds > 60)
        this.minutes = this.seconds / 60;

    if (this.minutes > 60)
        this.hours = this.minutes / 60;
        
    if (this.hours > 24)
        this.days = this.hours / 24;

    this.print();
}

PerformanceStats.prototype.print = function() {
    let report = {};
    report.millis = this.millis ? this.millis : undefined;
    report.seconds = this.seconds ? this.seconds : undefined;
    report.minutes = this.minutes ? this.minutes : undefined;
    report.hours = this.hours ? this.hours : undefined;
    report.days = this.days ? this.days : undefined;
    logger.debug('\nPerformance report\n*\n* ' + this.job + ' \n*\n' + JSON.stringify(report, null, 4) + '\n');
}

module.exports = PerformanceStats;
