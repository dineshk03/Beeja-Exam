// PM2 Configuration for Production Deployment
module.exports = {
  apps: [{
    name: 'exam-portal',
    script: 'server/index.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart configuration
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_memory_restart: '1G',
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Environment specific settings
    node_args: '--max-old-space-size=2048'
  }]
};
