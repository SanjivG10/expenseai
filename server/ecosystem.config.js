module.exports = {
  apps: [{
    name: 'expenseai-server',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // Advanced PM2 features
    max_memory_restart: '1G',
    
    // Auto restart
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Watch files for changes (disabled in production)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git'
    ],
    
    // Environment variables
    env_file: '.env'
  }]
};