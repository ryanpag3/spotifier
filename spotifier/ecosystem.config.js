module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'spotifier',
      script    : './server/server.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'ryan',
      host : 'localhost',
      ref  : 'origin/master',
      repo : 'https://github.com/ryanpage42/spotifier.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production --node-args="--max-old-space-size=2048"'
    }
  }
};
