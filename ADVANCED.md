# Advanced Configuration Guide

This guide covers advanced configuration options and deployment strategies for the YouTube Bot with Anti-Detection System.

## 🔧 Advanced Environment Configuration

### Anti-Detection Settings

```env
# Core Anti-Detection
ENABLE_ANTI_DETECTION=true
STEALTH_MODE=maximum                   # minimal | standard | maximum
DETECTION_EVASION_LEVEL=5             # 1-5 (higher = more evasive)

# Proxy Configuration  
PROXY_ROTATION_INTERVAL=900000        # 15 minutes
PROXY_HEALTH_CHECK_INTERVAL=300000    # 5 minutes
MAX_PROXY_FAILURES=3                  # Max failures before proxy removal
PROXY_TIMEOUT=10000                   # Proxy connection timeout (ms)
PROXY_SOURCES=proxyscrape,github,proxylist  # Comma-separated sources

# Fingerprinting
CANVAS_SPOOFING=true                  # Enable canvas fingerprint spoofing
WEBRTC_SPOOFING=true                  # Enable WebRTC leak protection
USER_AGENT_ROTATION=true              # Rotate user agents
SCREEN_RESOLUTION_SPOOFING=true       # Spoof screen resolution
FONT_FINGERPRINTING=true              # Spoof available fonts

# Geographic Spoofing
TIMEZONE_SPOOFING=true                # Match timezone with proxy location
LANGUAGE_SPOOFING=true                # Match language with proxy region
GEOLOCATION_SPOOFING=true             # Spoof GPS coordinates
```

### Human Behavior Simulation

```env
# Timing Patterns
MIN_ACTION_DELAY=1000                 # Minimum delay between actions (ms)
MAX_ACTION_DELAY=5000                 # Maximum delay between actions (ms)
HUMAN_VARIANCE_FACTOR=0.3             # Timing variance (0.0-1.0)

# Typing Simulation
TYPING_SPEED_MIN=45                   # Minimum typing speed (WPM)
TYPING_SPEED_MAX=120                  # Maximum typing speed (WPM)
TYPING_MISTAKE_PROBABILITY=0.05       # Probability of typing mistakes
BACKSPACE_PROBABILITY=0.1             # Probability of backspacing

# Mouse Movement
MOUSE_MOVEMENT_SIMULATION=true        # Enable mouse movement simulation
MOUSE_SPEED_MIN=50                    # Minimum mouse speed (px/s)
MOUSE_SPEED_MAX=200                   # Maximum mouse speed (px/s)

# Reading Behavior
READING_SPEED_WPM=200                 # Average reading speed
PAUSE_PROBABILITY=0.2                 # Probability of reading pauses
SCROLL_BEHAVIOR=natural               # natural | random | linear
```

### Session Management

```env
# Session Limits
MAX_VIDEOS_PER_SESSION=10             # Videos per session
MAX_ACTIONS_PER_SESSION=50            # Total actions per session
SESSION_DURATION_MIN=1800000          # Minimum session duration (30 min)
SESSION_DURATION_MAX=7200000          # Maximum session duration (2 hours)

# Cooldown Periods
SESSION_COOLDOWN_MIN=300000           # Minimum cooldown between sessions (5 min)
SESSION_COOLDOWN_MAX=3600000          # Maximum cooldown between sessions (1 hour)
ERROR_COOLDOWN_FACTOR=2               # Multiply cooldown on errors

# Session Persistence
SAVE_SESSION_STATE=true               # Save session state to disk
SESSION_STATE_FILE=data/sessions.json # Session state file path
AUTO_RESUME_SESSIONS=true             # Auto-resume interrupted sessions
```

## 🛡️ Security Configuration

### Network Security

```env
# TLS Configuration
TLS_MIN_VERSION=1.2                   # Minimum TLS version
TLS_CIPHERS=ECDHE-RSA-AES128-GCM-SHA256,ECDHE-RSA-AES256-GCM-SHA384
VERIFY_SSL_CERTIFICATES=true          # Verify SSL certificates

# DNS Configuration
DNS_SERVERS=1.1.1.1,8.8.8.8         # Custom DNS servers
DNS_OVER_HTTPS=true                   # Use DNS over HTTPS
DNS_CACHE_TTL=300                     # DNS cache TTL (seconds)

# Request Headers
CUSTOM_HEADERS=true                   # Enable custom headers
REFERRER_POLICY=strict-origin-when-cross-origin
ACCEPT_LANGUAGE=en-US,en;q=0.9        # Default accept language
```

### Data Protection

```env
# Logging Security
LOG_LEVEL=info                        # debug | info | warn | error
LOG_SENSITIVE_DATA=false              # Log sensitive information
LOG_ROTATION=true                     # Enable log rotation
MAX_LOG_SIZE=10MB                     # Maximum log file size
MAX_LOG_FILES=5                       # Maximum number of log files

# Data Encryption
ENCRYPT_SESSION_DATA=true             # Encrypt session data
ENCRYPTION_KEY_FILE=.keys/session.key # Encryption key file path
HASH_USER_DATA=true                   # Hash user-identifiable data
```

## 🚀 Production Deployment

### High-Availability Setup

#### Load Balancer Configuration (Nginx)

```nginx
upstream video_bot {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://video_bot;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### PM2 Cluster Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'video-bot-cluster',
    script: 'index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      ENABLE_CLUSTERING: true
    },
    // Resource limits
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    
    // Logging
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Docker Production Setup

#### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Create required directories
RUN mkdir -p data logs && chown -R nodeuser:nodejs data logs

# Security hardening
RUN apk add --no-cache dumb-init
USER nodeuser

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

#### Docker Compose for Production

```yaml
version: '3.8'

services:
  video-bot:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ENABLE_ANTI_DETECTION=true
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./.env:/app/.env:ro
    networks:
      - bot-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - video-bot
    networks:
      - bot-network

networks:
  bot-network:
    driver: bridge
```

## 📊 Monitoring and Alerting

### Prometheus Metrics

```javascript
// Add to server.js for monitoring
const prometheus = require('prom-client');

// Create custom metrics
const activeProxies = new prometheus.Gauge({
  name: 'video_bot_active_proxies',
  help: 'Number of active proxies'
});

const sessionsTotal = new prometheus.Counter({
  name: 'video_bot_sessions_total',
  help: 'Total number of bot sessions'
});

const errorsTotal = new prometheus.Counter({
  name: 'video_bot_errors_total',
  help: 'Total number of errors',
  labelNames: ['type']
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Health Check Endpoint

```javascript
// Health check implementation
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    proxies: {
      active: proxyManager.getActiveCount(),
      total: proxyManager.getTotalCount()
    },
    sessions: {
      active: sessionManager.getActiveCount(),
      total: sessionManager.getTotalCount()
    }
  };
  
  res.json(health);
});
```

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Monitor memory usage
pm2 monit

# Restart if memory usage is high
pm2 restart video-bot

# Adjust max memory restart
pm2 start index.js --max-memory-restart 400M
```

#### Proxy Issues
```bash
# Check proxy health
curl http://localhost:3000/api/proxy/health

# Refresh proxy list
curl -X POST http://localhost:3000/api/proxy/refresh

# View proxy logs
tail -f logs/proxy-health.log
```

#### Performance Issues
```bash
# Enable Node.js profiling
node --inspect index.js

# Generate heap dump
kill -USR2 $(pgrep -f "node.*index.js")

# Analyze with clinic.js
npm install -g clinic
clinic doctor -- node index.js
```

### Log Analysis

```bash
# View real-time logs
tail -f logs/bot-activity.log

# Search for errors
grep -i error logs/*.log

# Analyze proxy performance
awk '/proxy/ {print $0}' logs/bot-activity.log | tail -100

# Session statistics
grep "Session completed" logs/bot-activity.log | wc -l
```

## 📈 Performance Optimization

### Database Optimizations

```javascript
// Optimize proxy storage with indexing
const proxies = new Map(); // Use Map for O(1) lookups
const proxyIndex = {
  byCountry: new Map(),
  byType: new Map(),
  byHealth: new Map()
};

// Batch operations
const batchSize = 100;
const processBatch = async (items) => {
  const promises = items.map(item => processItem(item));
  return Promise.allSettled(promises);
};
```

### Memory Management

```javascript
// Implement proper cleanup
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await cleanupResources();
  process.exit(0);
});

// Garbage collection hints
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 30000);
}
```

### Caching Strategies

```javascript
// Implement response caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ 
  stdTTL: 600,  // 10 minutes
  checkperiod: 120 
});

// Cache proxy validation results
const cacheKey = `proxy_${proxy.ip}_${proxy.port}`;
const cachedResult = cache.get(cacheKey);
if (cachedResult) return cachedResult;
```

This advanced configuration guide provides comprehensive settings for production deployment, monitoring, and optimization of the YouTube Bot system.
