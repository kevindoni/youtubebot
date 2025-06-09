# 🤖 Advanced Video Bot with Anti-Detection System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

A sophisticated video engagement bot with **advanced anti-detection features**, proxy rotation, and human behavior simulation. Perfect for automated video engagement with stealth capabilities.

## ✨ Features

### 🎯 Core Functionality
- **Automated Video Engagement**: Watch, like, and comment on videos
- **Intelligent Batch Processing**: Handle multiple videos with smart scheduling
- **Web Admin Panel**: Real-time monitoring and control interface
- **VPS Ready**: No GUI dependencies, perfect for server deployment

### 🛡️ Anti-Detection System
- **Free Proxy Management**: 2000+ proxies from multiple sources with health monitoring
- **Human Behavior Simulation**: Realistic timing, typing patterns, and interaction delays
- **Advanced Fingerprinting**: Canvas, WebRTC, and browser characteristic spoofing
- **Geographic Spoofing**: Location, timezone, and language randomization
- **Session Management**: Automatic rotation and cleanup for maximum stealth

### 📊 Advanced Analytics
- **Real-time Statistics**: Monitor proxy health, success rates, and activity
- **Performance Tracking**: Detailed logs and metrics for optimization
- **Error Handling**: Robust error recovery and retry mechanisms

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/kevindoni/youtubebot.git
cd youtubebot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
# For Windows/Linux/Mac
cp .env.example .env

# Edit .env with your favorite editor:
# Windows: notepad .env
# Linux/Mac: nano .env
# Or use VS Code: code .env
```

4. **Run the bot:**
```bash
npm start
```

### 🚀 Quick Setup Scripts

For easier setup, use our automated setup scripts:

#### Windows
```cmd
# Run the Windows setup script
setup.bat
```

#### Linux/macOS
```bash
# Make executable and run
chmod +x setup.sh
./setup.sh
```

#### Cross-Platform (Node.js)
```bash
# Universal setup script
node setup.js
```

These scripts will:
- ✅ Check prerequisites (Node.js 18+, Git)
- 📁 Create necessary directories
- 📄 Set up environment file
- 📦 Install dependencies
- 📋 Show next steps

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```env
# Bot Configuration
BOT_MODE=simulation                    # simulation | live
MAX_VIDEOS_PER_SESSION=5              # Videos per session
SESSION_TIMEOUT=3600000               # Session timeout (ms)

# Anti-Detection Settings
ENABLE_ANTI_DETECTION=true            # Enable stealth features
PROXY_ROTATION_INTERVAL=900000        # Proxy rotation (15 min)
MAX_REQUESTS_PER_SESSION=50           # Max requests per session

# Human Behavior
MIN_WATCH_TIME=10000                  # Minimum watch time (ms)
MAX_WATCH_TIME=180000                 # Maximum watch time (ms)
TYPING_SPEED_MIN=50                   # Typing speed range (wpm)
TYPING_SPEED_MAX=150

# Server Settings
PORT=3000                             # Web panel port
HOST=localhost                        # Server host
```

## 📖 Usage

### 🎮 Basic Usage
```bash
# Run single video bot
node index.js

# Run with specific video URL
node index.js --url "https://youtube.com/watch?v=VIDEO_ID"
```

### 📦 Batch Processing
```bash
# Process multiple videos
node batch.js

# Custom batch configuration
node batch.js --videos 10 --delay 5000
```

### 🌐 Web Admin Panel
```bash
# Start web interface
node server.js

# Access panel at: http://localhost:3000
```

### 🖥️ Admin Panel Features
- **Real-time Dashboard**: Live statistics and system status
- **Proxy Monitor**: Active proxy count and health metrics
- **Session Control**: Start, stop, and configure bot sessions
- **Activity Logs**: Detailed activity and error logs
- **Anti-Detection Stats**: Current fingerprint and behavior status

## 🛡️ Anti-Detection Features

### 🌍 Proxy Management
- **Multiple Sources**: 5+ free proxy sources (ProxyScrape, GitHub lists, etc.)
- **Health Monitoring**: Automatic validation and dead proxy removal
- **Geographic Distribution**: Proxies from 50+ countries
- **Protocol Support**: HTTP, HTTPS, SOCKS4, SOCKS5

### 🧠 Human Behavior Simulation
- **Realistic Timing**: Human-like delays between actions
- **Typing Patterns**: Natural typing speed and rhythm simulation
- **Mouse Movement**: Simulated cursor movement patterns
- **Reading Time**: Intelligent content-based timing calculation

### 🔍 Fingerprint Spoofing
- **Canvas Fingerprinting**: Unique canvas signatures per session
- **WebRTC Protection**: IP leak prevention and spoofing
- **User Agent Rotation**: 20+ realistic browser signatures
- **Screen Resolution**: Dynamic resolution and viewport spoofing
- **Font Detection**: Browser font capability simulation

### 🌐 Geographic Spoofing
- **Timezone Sync**: Coordinate timezone with proxy location
- **Language Headers**: Localized language preferences
- **Location Services**: GPS coordinate spoofing
- **Cultural Patterns**: Region-specific behavior simulation

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Video Bot     │ ←→ │ Anti-Detection   │ ←→ │  Proxy Manager  │
│   (index.js)    │    │  (anti-detect)   │    │ (proxy-mgr.js)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ↓                       ↓                       ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Admin Panel    │    │ Human Behavior   │    │   Data Layer    │
│ (admin-panel)   │    │ (human-behave)   │    │   (data/)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Advanced Usage

### Custom Bot Behavior
```javascript
const VideoBot = require('./index.js');

const bot = new VideoBot({
  antiDetection: true,
  maxVideos: 10,
  watchTimeRange: [30000, 300000],
  commentProbability: 0.3,
  likeProbability: 0.7
});

await bot.start();
```

### Proxy Configuration
```javascript
const ProxyManager = require('./proxy-manager.js');

const proxyMgr = new ProxyManager({
  sources: ['proxyscrape', 'github', 'proxy-list'],
  validation: true,
  healthCheck: 30000,
  maxRetries: 3
});
```

## 📝 Logs and Monitoring

### Log Files
- `logs/bot-activity.log` - Bot activity and actions
- `logs/proxy-health.log` - Proxy status and performance
- `logs/error.log` - Error tracking and debugging

### Real-time Monitoring
Access the web panel at `http://localhost:3000` for:
- Live activity feed
- Proxy status dashboard
- Performance metrics
- Session management

## 🚀 Deployment

### VPS Deployment

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/kevindoni/youtubebot.git
cd youtubebot
npm install

# Configure environment
cp .env.example .env
nano .env

# Run with PM2
npm install -g pm2
pm2 start index.js --name "video-bot"
pm2 startup
pm2 save
```

#### Linux (CentOS/RHEL/Amazon Linux)
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone and setup
git clone https://github.com/kevindoni/youtubebot.git
cd youtubebot
npm install

# Configure environment
cp .env.example .env
vi .env

# Run with PM2
npm install -g pm2
pm2 start index.js --name "video-bot"
pm2 startup
pm2 save
```

#### Windows Server
```powershell
# Install Node.js (download from nodejs.org or use winget)
winget install OpenJS.NodeJS

# Clone and setup
git clone https://github.com/kevindoni/youtubebot.git
cd youtubebot
npm install

# Configure environment
copy .env.example .env
notepad .env

# Run with PM2
npm install -g pm2
pm2 start index.js --name "video-bot"
pm2 startup
pm2 save
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛠️ Development

### Project Structure
```
├── index.js              # Main bot engine
├── anti-detection.js     # Anti-detection coordinator
├── proxy-manager.js      # Proxy management system
├── human-behavior.js     # Human behavior simulation
├── server.js             # Web server
├── admin-panel.js        # Admin interface
├── batch.js              # Batch processing
├── setup.js              # Cross-platform setup script
├── setup.bat             # Windows setup script
├── setup.sh              # Linux/macOS setup script
├── data/
│   └── proxies.json      # Proxy database
├── logs/
│   └── bot-activity.log  # Activity logs
└── package.json          # Dependencies
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## ⚠️ Legal Notice

**This software is for educational and research purposes only.**

- Users must comply with all applicable laws and regulations
- Respect platform terms of service and rate limits  
- Use responsibly and ethically
- The developers are not responsible for misuse

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/kevindoni/youtubebot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kevindoni/youtubebot/discussions)
- **Documentation**: [Wiki](https://github.com/kevindoni/youtubebot/wiki)

## 🌟 Acknowledgments

- Proxy sources: ProxyScrape, GitHub proxy lists, Proxy-List.download
- Anti-detection techniques: Various security research papers
- Human behavior patterns: Web analytics and user behavior studies

---

**⭐ Star this repository if you find it useful!**
