const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.ADMIN_PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (in production, use database)
let users = [
    {
        id: 1,
        username: 'admin',
        password: '$2b$10$cst9nH.2r6XRcnuhuDg7XOAdf7GZeZ7ZWffj.2oFIAjCC54nYq6FW', // admin123
        role: 'admin'
    }
];

let bots = new Map(); // Active bots
let videos = []; // Video queue
let stats = {
    totalVideos: 0,
    totalLikes: 0,
    totalComments: 0,
    activeJobs: 0,
    successRate: 0
};

// Broadcast to all connected WebSocket clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Main admin panel HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Bot Admin Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            color: white;
            text-align: center;
        }
        
        .login-form {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 40px;
            max-width: 400px;
            margin: 50px auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .admin-panel {
            display: none;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        
        .controls {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #2ed573 0%, #1e90ff 100%);
        }
        
        .video-queue {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .video-item {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logs {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 30px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 14px;
        }
        
        .log-info { color: #007bff; }
        .log-success { color: #28a745; }
        .log-warning { color: #ffc107; }
        .log-error { color: #dc3545; }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        .status-busy { background: #ffc107; }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Video Bot Admin Panel</h1>
            <p>Monitor and control your video automation bots</p>
        </div>
        
        <!-- Login Form -->
        <div id="loginForm" class="login-form">
            <h2 style="text-align: center; margin-bottom: 30px;">Admin Login</h2>
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" placeholder="Enter username">
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" placeholder="Enter password">
            </div>
            <button class="btn" onclick="login()" style="width: 100%;">Login</button>
            <div id="loginError" style="color: red; margin-top: 10px; text-align: center;"></div>
        </div>
        
        <!-- Admin Panel -->
        <div id="adminPanel" class="admin-panel">            <!-- Statistics -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="totalVideos">0</div>
                    <div class="stat-label">Total Videos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalLikes">0</div>
                    <div class="stat-label">Total Likes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalComments">0</div>
                    <div class="stat-label">Total Comments</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="activeJobs">0</div>
                    <div class="stat-label">Active Jobs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="proxyCount">0</div>
                    <div class="stat-label">🌐 Active Proxies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="currentLocation">Unknown</div>
                    <div class="stat-label">🌍 Current Location</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="fingerprint">Active</div>
                    <div class="stat-label">🛡️ Fingerprint Spoofing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="userAgent">Chrome</div>
                    <div class="stat-label">🌐 Current Browser</div>
                </div>
            </div>
            
            <div class="grid-2">
                <!-- Controls -->
                <div class="controls">
                    <h3>Add Video to Queue</h3>
                    <div class="form-group">
                        <label for="videoUrl">Video URL:</label>
                        <input type="url" id="videoUrl" placeholder="https://youtube.com/watch?v=...">
                    </div>
                    <div class="form-group">
                        <label for="watchTime">Watch Time (seconds):</label>
                        <input type="number" id="watchTime" value="30" min="5" max="600">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="shouldLike" checked> Like Video
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="shouldComment" checked> Comment on Video
                        </label>
                    </div>
                    <div class="form-group">
                        <label for="customComment">Custom Comment:</label>
                        <textarea id="customComment" rows="3" placeholder="Leave empty for random comment"></textarea>
                    </div>
                    <button class="btn btn-success" onclick="addVideo()">Add to Queue</button>
                    <button class="btn" onclick="startBatch()">Start Batch</button>
                    <button class="btn btn-danger" onclick="stopAll()">Stop All</button>
                </div>
                
                <!-- Quick Actions -->
                <div class="controls">
                    <h3>Quick Actions</h3>
                    <button class="btn" onclick="getStatus()">Refresh Status</button>
                    <button class="btn" onclick="clearQueue()">Clear Queue</button>
                    <button class="btn" onclick="exportLogs()">Export Logs</button>
                    <button class="btn btn-danger" onclick="logout()">Logout</button>
                    
                    <h4 style="margin-top: 20px;">System Info</h4>
                    <div id="systemInfo">
                        <p><span class="status-indicator status-online"></span>Server Online</p>
                        <p>Uptime: <span id="uptime">--</span></p>
                        <p>Memory: <span id="memory">--</span></p>
                    </div>
                </div>
            </div>
            
            <!-- Video Queue -->
            <div class="video-queue">
                <h3>Video Queue (<span id="queueCount">0</span>)</h3>
                <div id="videoList"></div>
            </div>
            
            <!-- Logs -->
            <div class="logs">
                <h3>Real-time Logs</h3>
                <div id="logContainer"></div>
            </div>
        </div>
    </div>
    
    <script>
        let token = localStorage.getItem('adminToken');
        let ws = null;
        
        if (token) {
            showAdminPanel();
        }
        
        function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    token = data.token;
                    localStorage.setItem('adminToken', token);
                    showAdminPanel();
                } else {
                    document.getElementById('loginError').textContent = data.error || 'Login failed';
                }
            })
            .catch(err => {
                document.getElementById('loginError').textContent = 'Connection error';
            });
        }
        
        function logout() {
            localStorage.removeItem('adminToken');
            location.reload();
        }
        
        function showAdminPanel() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            connectWebSocket();
            getStatus();
        }
        
        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${location.host}\`);
            
            ws.onopen = () => {
                addLog('Connected to server', 'success');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                addLog('Disconnected from server', 'error');
                setTimeout(connectWebSocket, 5000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'stats':
                    updateStats(data.stats);
                    break;
                case 'log':
                    addLog(data.message, data.level);
                    break;
                case 'queue':
                    updateQueue(data.queue);
                    break;
                case 'status':
                    updateSystemInfo(data.info);
                    break;
            }
        }
        
        function updateStats(stats) {
            document.getElementById('totalVideos').textContent = stats.totalVideos;
            document.getElementById('totalLikes').textContent = stats.totalLikes;
            document.getElementById('totalComments').textContent = stats.totalComments;
            document.getElementById('activeJobs').textContent = stats.activeJobs;
        }
        
        function updateQueue(queue) {
            const container = document.getElementById('videoList');
            const count = document.getElementById('queueCount');
            
            count.textContent = queue.length;
            container.innerHTML = '';
            
            queue.forEach((video, index) => {
                const item = document.createElement('div');
                item.className = 'video-item';
                item.innerHTML = \`
                    <div>
                        <strong>\${video.url}</strong><br>
                        <small>Watch: \${video.watchTime}s | Like: \${video.shouldLike ? 'Yes' : 'No'} | Comment: \${video.shouldComment ? 'Yes' : 'No'}</small>
                    </div>
                    <button class="btn btn-danger" onclick="removeVideo(\${index})">Remove</button>
                \`;
                container.appendChild(item);
            });
        }
        
        function updateSystemInfo(info) {
            if (info.uptime) {
                document.getElementById('uptime').textContent = Math.floor(info.uptime / 60) + ' minutes';
            }
            if (info.memory) {
                document.getElementById('memory').textContent = Math.round(info.memory.heapUsed / 1024 / 1024) + ' MB';
            }
        }
        
        function addLog(message, level = 'info') {
            const container = document.getElementById('logContainer');
            const entry = document.createElement('div');
            entry.className = \`log-entry log-\${level}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
            
            // Keep only last 100 logs
            while (container.children.length > 100) {
                container.removeChild(container.firstChild);
            }
        }
        
        function addVideo() {
            const videoData = {
                url: document.getElementById('videoUrl').value,
                watchTime: parseInt(document.getElementById('watchTime').value) * 1000,
                shouldLike: document.getElementById('shouldLike').checked,
                shouldComment: document.getElementById('shouldComment').checked,
                customComment: document.getElementById('customComment').value || null
            };
            
            if (!videoData.url) {
                alert('Please enter a video URL');
                return;
            }
            
            apiCall('/api/queue/add', 'POST', videoData)
                .then(() => {
                    document.getElementById('videoUrl').value = '';
                    document.getElementById('customComment').value = '';
                    addLog('Video added to queue', 'success');
                });
        }
        
        function removeVideo(index) {
            apiCall('/api/queue/remove', 'POST', { index })
                .then(() => {
                    addLog('Video removed from queue', 'info');
                });
        }
        
        function startBatch() {
            apiCall('/api/batch/start', 'POST')
                .then(() => {
                    addLog('Batch processing started', 'success');
                });
        }
        
        function stopAll() {
            apiCall('/api/batch/stop', 'POST')
                .then(() => {
                    addLog('All jobs stopped', 'warning');
                });
        }
        
        function clearQueue() {
            apiCall('/api/queue/clear', 'POST')
                .then(() => {
                    addLog('Queue cleared', 'info');
                });
        }
        
        function getStatus() {
            apiCall('/api/status', 'GET')
                .then(data => {
                    updateStats(data.stats);
                    updateQueue(data.queue);
                    updateSystemInfo(data.system);
                });
        }
        
        function exportLogs() {
            apiCall('/api/logs/export', 'GET')
                .then(data => {
                    const blob = new Blob([data.logs], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`bot-logs-\${new Date().toISOString().split('T')[0]}.txt\`;
                    a.click();
                });
        }
        
        function apiCall(endpoint, method, data = null) {
            const options = {
                method,
                headers: {
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            return fetch(endpoint, options)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    return data;
                })
                .catch(err => {
                    addLog(\`Error: \${err.message}\`, 'error');
                    throw err;
                });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(getStatus, 30000);
    </script>
</body>
</html>
    `);
});

// API Routes

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Get status
app.get('/api/status', authenticateToken, (req, res) => {
    res.json({
        stats,
        queue: videos,
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            bots: bots.size
        }
    });
});

// Add video to queue
app.post('/api/queue/add', authenticateToken, (req, res) => {
    const { url, options } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'Video URL is required' });
    }
    
    const video = {
        id: Date.now(),
        url,
        watchTime: options?.watchTime || 30000,
        like: options?.like || false,
        comment: options?.comment || false,
        customComment: options?.customComment,
        status: 'pending',
        addedAt: new Date()
    };
    
    videos.push(video);
    
    broadcast({
        type: 'queue',
        queue: videos
    });
    
    broadcast({
        type: 'log',
        message: `Video added to queue: ${url}`,
        level: 'info'
    });
    
    res.json({ success: true, video });
});

// Remove video from queue
app.post('/api/queue/remove', authenticateToken, (req, res) => {
    const { index } = req.body;
    
    if (index >= 0 && index < videos.length) {
        const removed = videos.splice(index, 1)[0];
        
        broadcast({
            type: 'queue',
            queue: videos
        });
        
        broadcast({
            type: 'log',
            message: `Video removed from queue: ${removed.url}`,
            level: 'info'
        });
        
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Invalid index' });
    }
});

// Clear queue
app.post('/api/queue/clear', authenticateToken, (req, res) => {
    videos = [];
    
    broadcast({
        type: 'queue',
        queue: videos
    });
    
    broadcast({
        type: 'log',
        message: 'Queue cleared',
        level: 'info'
    });
    
    res.json({ success: true });
});

// Start batch processing
app.post('/api/batch/start', authenticateToken, async (req, res) => {
    if (videos.length === 0) {
        return res.status(400).json({ error: 'No videos in queue' });
    }
    
    stats.activeJobs++;
    
    broadcast({
        type: 'stats',
        stats
    });
    
    broadcast({
        type: 'log',
        message: `Starting batch processing of ${videos.length} videos`,
        level: 'info'
    });
    
    // Simulate processing (in real implementation, this would call actual bot functions)
    processBatch();
    
    res.json({ success: true, message: 'Batch processing started' });
});

// Stop all jobs
app.post('/api/batch/stop', authenticateToken, (req, res) => {
    // Stop all active bots
    bots.forEach((bot, id) => {
        // In real implementation, stop the actual bot process
        bots.delete(id);
    });
    
    stats.activeJobs = 0;
    
    broadcast({
        type: 'stats',
        stats
    });
    
    broadcast({
        type: 'log',
        message: 'All jobs stopped',
        level: 'warning'
    });
    
    res.json({ success: true });
});

// Export logs
app.get('/api/logs/export', authenticateToken, (req, res) => {
    const logsDir = path.join(__dirname, 'logs');
    let allLogs = '';
    
    try {
        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            files.forEach(file => {
                if (file.endsWith('.log')) {
                    const filePath = path.join(logsDir, file);
                    allLogs += `\n=== ${file} ===\n`;
                    allLogs += fs.readFileSync(filePath, 'utf8');
                }
            });
        }
    } catch (error) {
        allLogs = 'Error reading logs: ' + error.message;
    }
    
    res.json({ logs: allLogs });
});

// Simulate batch processing
async function processBatch() {
    const queue = [...videos];
    videos = []; // Clear queue
    
    for (let i = 0; i < queue.length; i++) {
        const video = queue[i];
        
        broadcast({
            type: 'log',
            message: `Processing video ${i + 1}/${queue.length}: ${video.url}`,
            level: 'info'
        });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate results
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
            stats.totalVideos++;
            if (video.shouldLike) stats.totalLikes++;
            if (video.shouldComment) stats.totalComments++;
            
            broadcast({
                type: 'log',
                message: `✅ Successfully processed: ${video.url}`,
                level: 'success'
            });
        } else {
            broadcast({
                type: 'log',
                message: `❌ Failed to process: ${video.url}`,
                level: 'error'
            });
        }
        
        broadcast({
            type: 'stats',
            stats
        });
        
        // Random delay between videos
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    }
    
    stats.activeJobs--;
    stats.successRate = Math.round((stats.totalVideos / (stats.totalVideos + queue.length - stats.totalVideos)) * 100);
    
    broadcast({
        type: 'stats',
        stats
    });
    
    broadcast({
        type: 'log',
        message: `🎉 Batch processing completed. Processed ${queue.length} videos.`,
        level: 'success'
    });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Video Bot Admin Panel running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Access from external: http://your-vps-ip:${PORT}`);
    console.log(`🔐 Default login: admin / admin123`);
});

module.exports = app;
