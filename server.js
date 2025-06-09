const express = require('express');
const VideoBot = require('./index');
const AntiDetectionManager = require('./anti-detection');
const chalk = require('chalk');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store active bot instances and anti-detection manager
const activeBots = new Map();
const antiDetection = new AntiDetectionManager();

// Routes
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Video Bot Control Panel</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .form-group { margin: 15px 0; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
                .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            </style>
        </head>
        <body>
            <h1>🤖 Video Bot Control Panel</h1>
            
            <form id="botForm">
                <div class="form-group">
                    <label for="videoUrl">Video URL:</label>
                    <input type="url" id="videoUrl" name="videoUrl" required 
                           placeholder="https://www.youtube.com/watch?v=...">
                </div>
                
                <div class="form-group">
                    <label for="watchTime">Watch Time (seconds):</label>
                    <input type="number" id="watchTime" name="watchTime" value="30" min="1" max="600">
                </div>
                  <div class="form-group">
                    <label>
                        <input type="checkbox" id="shouldLike" name="shouldLike" checked> Like Video
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="shouldComment" name="shouldComment" checked> Comment on Video
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="customComment">Custom Comment (optional):</label>
                    <textarea id="customComment" name="customComment" rows="3" 
                              placeholder="Leave empty for random comment"></textarea>
                </div>
                
                <button type="submit">🚀 Start Bot</button>
                <button type="button" id="stopBot">🛑 Stop Bot</button>
            </form>
            
            <div id="status"></div>
            
            <script>
                document.getElementById('botForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(e.target);                    const data = {
                        videoUrl: formData.get('videoUrl'),
                        watchTime: parseInt(formData.get('watchTime')) * 1000,
                        like: formData.get('shouldLike') === 'on',
                        comment: formData.get('shouldComment') === 'on',
                        customComment: formData.get('customComment') || null
                    };
                    
                    document.getElementById('status').innerHTML = 
                        '<div class="info">🤖 Starting bot...</div>';
                    
                    try {
                        const response = await fetch('/api/start-bot', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            document.getElementById('status').innerHTML = 
                                '<div class="success">✅ Bot started successfully!</div>';
                        } else {
                            document.getElementById('status').innerHTML = 
                                '<div class="error">❌ Error: ' + result.error + '</div>';
                        }
                    } catch (error) {
                        document.getElementById('status').innerHTML = 
                            '<div class="error">❌ Network error: ' + error.message + '</div>';
                    }
                });
                
                document.getElementById('stopBot').addEventListener('click', async () => {
                    try {
                        const response = await fetch('/api/stop-bot', { method: 'POST' });
                        const result = await response.json();
                        
                        document.getElementById('status').innerHTML = 
                            '<div class="info">🛑 Bot stopped</div>';
                    } catch (error) {
                        document.getElementById('status').innerHTML = 
                            '<div class="error">❌ Error stopping bot: ' + error.message + '</div>';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// API Routes
app.post('/api/start-bot', async (req, res) => {
    try {
        const { videoUrl, watchTime, like, comment, customComment } = req.body;
        
        // Validate input
        if (!videoUrl) {
            return res.json({ success: false, error: 'Video URL is required' });
        }
        
        // Create new bot instance
        const botId = Date.now().toString();
        const bot = new VideoBot();
        activeBots.set(botId, bot);
        
        // Start bot asynchronously
        (async () => {
            try {
                console.log(chalk.blue(`🤖 Starting bot ${botId} for ${videoUrl}`));
                await bot.init();
                
                await bot.watchVideo(videoUrl, {
                    like,
                    comment,
                    watchTime,
                    customComment
                });
                
                console.log(chalk.green(`✅ Bot ${botId} completed successfully`));
            } catch (error) {
                console.error(chalk.red(`❌ Bot ${botId} error:`), error.message);
            } finally {
                await bot.cleanup();
                activeBots.delete(botId);
            }
        })();
        
        res.json({ 
            success: true, 
            message: 'Bot started successfully',
            botId 
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/stop-bot', async (req, res) => {
    try {
        // Close all active bots
        for (const [botId, bot] of activeBots) {
            await bot.cleanup();
            activeBots.delete(botId);
            console.log(chalk.yellow(`🛑 Bot ${botId} stopped`));
        }
        
        res.json({ success: true, message: 'All bots stopped' });
    } catch (error) {
        console.error('Stop Bot Error:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    const antiDetectionStats = antiDetection.getStats();
    
    res.json({
        activeBots: activeBots.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        antiDetection: antiDetectionStats
    });
});

// New anti-detection endpoints
app.get('/api/anti-detection/stats', (req, res) => {
    const stats = antiDetection.getStats();
    res.json(stats);
});

app.post('/api/anti-detection/rotate', async (req, res) => {
    try {
        await antiDetection.rotateSession();
        res.json({ success: true, message: 'Session rotated successfully' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Health check endpoint for monitoring and Docker
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        bots: {
            active: activeBots.size,
            total: activeBots.size
        },
        antiDetection: antiDetection ? {
            enabled: true,
            proxyCount: antiDetection.proxyManager ? antiDetection.proxyManager.getActiveCount() : 0
        } : {
            enabled: false
        }
    };
    
    res.json(health);
});

// Simple status endpoint
app.get('/ping', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
    });
});

// Start server
app.listen(port, () => {
    console.log(chalk.green(`🌐 Video Bot Server running on http://localhost:${port}`));
    console.log(chalk.blue('📊 Visit the control panel to manage your bots'));
});

module.exports = app;
