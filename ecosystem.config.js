module.exports = {
  apps: [{
    name:            'esnsa-api',
    script:          './backend/server.js',
    cwd:             '/home/ubuntu/esnsa-app',
    env: {
      NODE_ENV: 'production',
    },
    error_file:      '/var/log/esnsa/error.log',
    out_file:        '/var/log/esnsa/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay:   3000,
    max_restarts:    10,
    watch:           false,
  }]
};
