module.exports = {
  apps: [
    {
      name: 'youtube-bot-cluster',
      script: 'server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // Performance monitoring
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced options
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'data'],
      
      // Auto-restart on file changes (development only)
      watch_options: {
        followSymlinks: false,
        usePolling: true,
        interval: 1000
      },
      
      // Kill timeout
      kill_timeout: 5000,
        // Wait ready timeout
      wait_ready: true,
      listen_timeout: 8000,
      
      // Auto-restart settings
      restart_delay: 4000,
      autorestart: true,
      
      // Merge logs
      merge_logs: true,
      
      // Cron restart (every day at 3 AM)
      cron_restart: '0 3 * * *',
      
      // Environment variables
      env_file: '.env'
    },
    {
      name: 'youtube-bot-single',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      
      // Development settings
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'data'],
      
      // Logging
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Performance monitoring
      max_memory_restart: '500M',
      min_uptime: '5s',
      max_restarts: 50,
      
      // Auto-restart settings
      restart_delay: 1000,
      autorestart: true,
      
      // Kill timeout
      kill_timeout: 3000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/youtube-bot.git',
      path: '/home/ubuntu/youtube-bot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    development: {
      user: 'ubuntu',
      host: ['dev-server-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/youtube-bot.git',
      path: '/home/ubuntu/youtube-bot-dev',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development',
      'pre-setup': '',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};
