# YouTube Bot - Quick Start Guide

## 🚀 Quick Deployment Commands

### Development Setup
```bash
# Basic setup
npm run setup
npm run server

# PM2 Development
npm run pm2:dev
npm run status

# With monitoring
npm run monitor
```

### Production Deployment

#### Option 1: PM2 (Recommended)
```bash
# Single command deployment
npm run pm2:cluster

# With monitoring
npm run pm2:cluster
npm run monitor

# Status check
npm run status
```

#### Option 2: Docker
```bash
# Build and deploy
docker-compose up -d

# With full monitoring stack
docker-compose up -d youtube-bot redis nginx prometheus grafana

# Check status
docker-compose ps
```

## 📊 Monitoring & Management

### Real-time Status Dashboard
```bash
npm run status          # One-time status check
npm run status:watch    # Auto-refreshing dashboard
```

### Performance Monitoring
```bash
npm run monitor         # Standard monitoring (30s intervals)
npm run monitor:custom  # Custom monitoring (10s intervals, 75% memory threshold)
```

### PM2 Management
```bash
npm run pm2:status      # Show process status
npm run pm2:logs        # View logs
npm run pm2:restart     # Restart all processes
npm run pm2:stop        # Stop all processes
npm run pm2:monitor     # PM2 monitoring dashboard
```

## 🏥 Health Endpoints

- **Health Check**: `GET /health` - Comprehensive system metrics
- **Ping**: `GET /ping` - Simple uptime check

Example health response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {"used": 12, "total": 16, "rss": 577},
  "bots": {"active": 5, "total": 10},
  "antiDetection": {
    "enabled": true,
    "proxyStats": {"total": 2206, "working": 149, "averageResponseTime": 2594}
  }
}
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Copy and configure
cp .env.example .env

# Essential settings
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=your-admin-password
```

### Advanced Configuration
```bash
# Anti-detection settings
ENABLE_PROXY_ROTATION=true
HUMAN_BEHAVIOR_ENABLED=true
USER_AGENT_ROTATION=true

# Performance settings
MAX_CONCURRENT_BOTS=10
PROXY_TIMEOUT=10000
REQUEST_DELAY_MIN=1000
REQUEST_DELAY_MAX=5000
```

## 🐳 Docker Deployment

### Quick Start
```bash
# Basic deployment
docker-compose up -d youtube-bot redis

# Full stack with monitoring
docker-compose up -d
```

### Access Points
- **Bot Panel**: http://localhost:3000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Health Check**: http://localhost:3000/health

## 📈 Scaling & Performance

### PM2 Cluster Mode
```bash
# Auto-scale to CPU cores
npm run pm2:cluster

# Manual scaling
pm2 scale youtube-bot-cluster +2  # Add 2 instances
pm2 scale youtube-bot-cluster 4   # Set to 4 instances
```

### Memory Management
```bash
# Set memory limits in ecosystem.config.js
max_memory_restart: '1G'    # Restart if memory > 1GB
min_uptime: '10s'          # Minimum uptime before restart
max_restarts: 10           # Max restarts per hour
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <process-id> /F

# Or use different port
PORT=3001 npm run server
```

#### PM2 Process Issues
```bash
# Clean restart
pm2 delete all
npm run pm2:dev

# Check logs
npm run pm2:logs

# Reset PM2
pm2 kill
npm run pm2:dev
```

#### Memory Issues
```bash
# Check memory usage
npm run status

# Restart if needed
npm run pm2:restart

# Monitor in real-time
npm run monitor
```

### Performance Optimization

#### Proxy Health
- Monitor working proxy percentage
- Rotate proxies regularly
- Remove failed proxies automatically

#### Bot Management
- Limit concurrent bots based on system resources
- Implement proper delays between requests
- Monitor bot success rates

#### System Resources
- Monitor memory usage (keep below 80%)
- Check CPU usage during peak times
- Ensure adequate disk space for logs

## 🔒 Security Best Practices

### Environment Security
```bash
# Secure .env file
chmod 600 .env

# Use strong passwords
ADMIN_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
```

### Network Security
- Use HTTPS in production
- Configure firewall rules
- Limit admin panel access
- Enable rate limiting

### Proxy Security
- Use premium proxies when possible
- Rotate proxies frequently
- Monitor proxy reputation
- Implement proxy authentication

## 📊 Monitoring Alerts

### Memory Alerts
- Warning: >75% memory usage
- Critical: >90% memory usage
- Action: Automatic restart at >95%

### Performance Alerts
- Slow response: >2 seconds
- Proxy health: <50% working proxies
- Bot failures: >20% failure rate

### System Alerts
- Low uptime: <1 hour
- High restart count: >10 restarts/hour
- Disk space: <1GB available

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Configure `.env` file
- [ ] Test proxy list
- [ ] Verify system requirements
- [ ] Backup existing data

### Deployment
- [ ] Choose deployment method (PM2/Docker)
- [ ] Start application
- [ ] Verify health endpoints
- [ ] Check monitoring dashboard
- [ ] Test bot functionality

### Post-deployment
- [ ] Monitor performance for 1 hour
- [ ] Verify proxy rotation
- [ ] Check log files
- [ ] Set up automated backups
- [ ] Configure monitoring alerts

## 📞 Support

### Logs Location
- Application: `logs/bot-activity.log`
- PM2: `~/.pm2/logs/`
- Performance: `logs/performance.log`
- Docker: `docker-compose logs`

### Debug Commands
```bash
# Verbose logging
DEBUG=* npm run server

# PM2 debugging
pm2 logs --lines 100

# Health check
curl -s http://localhost:3000/health | jq .

# System resources
npm run status
```

---

🎉 **Your YouTube Bot is now ready for production!**

Access your control panel at: http://localhost:3000
