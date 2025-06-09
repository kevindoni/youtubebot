/**
 * Anti-Detection Manager - Mengelola semua aspek anti-deteksi
 * Mengintegrasikan proxy, human behavior, dan teknologi anti-bot
 */

const ProxyManager = require('./proxy-manager');
const HumanBehaviorSimulator = require('./human-behavior');
const crypto = require('crypto');

class AntiDetectionManager {
    constructor() {
        this.proxyManager = new ProxyManager();
        this.humanBehavior = new HumanBehaviorSimulator();
        
        // Session management
        this.sessionData = {
            startTime: Date.now(),
            requestCount: 0,
            rotationInterval: 15 * 60 * 1000, // 15 minutes
            lastRotation: Date.now(),
            maxRequestsPerSession: Math.floor(Math.random() * 50) + 20 // 20-70 requests
        };
        
        // Traffic patterns
        this.trafficPatterns = {
            dailyPeaks: [9, 12, 15, 19, 21], // Peak hours
            weeklyPattern: {
                monday: 0.8,
                tuesday: 0.9,
                wednesday: 1.0,
                thursday: 0.95,
                friday: 0.85,
                saturday: 0.7,
                sunday: 0.6
            }
        };
        
        console.log('🛡️ Anti-Detection Manager initialized');
        this.startRotationScheduler();
    }

    // Main method untuk request dengan anti-deteksi penuh
    async makeStealthRequest(url, options = {}) {
        await this.checkRotationNeeds();
        
        const proxy = this.proxyManager.getRandomProxy();
        if (!proxy) {
            console.warn('⚠️ No proxy available, using direct connection');
        }
        
        const headers = this.generateStealthHeaders(options.headers);
        const requestConfig = this.buildRequestConfig(url, options, proxy, headers);
        
        // Add human-like delay before request
        if (options.humanDelay !== false) {
            await this.humanBehavior.humanDelay(500, 2000);
        }
        
        try {
            console.log(`🌐 Making stealth request to: ${this.sanitizeUrl(url)}`);
            console.log(`📍 Using proxy: ${proxy ? proxy.address : 'Direct'}`);
            console.log(`👤 User-Agent: ${headers['User-Agent'].substring(0, 50)}...`);
            
            const response = await this.proxyManager.makeRequest(url, requestConfig);
            
            this.sessionData.requestCount++;
            this.updateSessionStats(response);
            
            return response;
            
        } catch (error) {
            console.error(`❌ Stealth request failed: ${error.message}`);
            
            // Try with different proxy if available
            if (proxy && this.proxyManager.workingProxies.length > 1) {
                console.log('🔄 Retrying with different proxy...');
                return this.makeStealthRequest(url, { ...options, retry: true });
            }
            
            throw error;
        }
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    generateStealthHeaders(customHeaders = {}) {
        const baseHeaders = this.humanBehavior.getHttpHeaders();
        
        // Add additional stealth headers
        const stealthHeaders = {
            ...baseHeaders,
            'Sec-Ch-Ua': this.generateSecChUa(),
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': `"${this.humanBehavior.currentProfile.browser.os}"`,
            'Viewport-Width': this.humanBehavior.currentProfile.screen.width.toString(),
            'Device-Memory': this.getRandomItem(['2', '4', '8']),
            'Downlink': (Math.random() * 10 + 1).toFixed(1),
            'Ect': this.getRandomItem(['4g', '3g']),
            'Rtt': Math.floor(Math.random() * 100 + 50).toString(),
            'Save-Data': Math.random() > 0.9 ? 'on' : undefined,
            ...customHeaders
        };
        
        // Remove undefined values
        Object.keys(stealthHeaders).forEach(key => {
            if (stealthHeaders[key] === undefined) {
                delete stealthHeaders[key];
            }
        });
        
        return stealthHeaders;
    }

    generateSecChUa() {
        const browser = this.humanBehavior.currentProfile.browser;
        
        switch (browser.name) {
            case 'Chrome':
                return `"Not_A Brand";v="8", "Chromium";v="${browser.version.split('.')[0]}", "Google Chrome";v="${browser.version.split('.')[0]}"`;
            case 'Firefox':
                return `"Firefox";v="${browser.version.split('.')[0]}"`;
            case 'Edge':
                return `"Not_A Brand";v="8", "Chromium";v="${browser.version.split('.')[0]}", "Microsoft Edge";v="${browser.version.split('.')[0]}"`;
            default:
                return `"Not_A Brand";v="8", "Chromium";v="120"`;
        }
    }

    buildRequestConfig(url, options, proxy, headers) {
        const config = {
            method: options.method || 'GET',
            headers: headers,
            timeout: options.timeout || 15000,
            data: options.data,
            validateStatus: () => true, // Accept all status codes
            maxRedirects: 5,
            ...options.axiosConfig
        };
        
        // Add proxy if available
        if (proxy) {
            const [ip, port] = proxy.address.split(':');
            config.proxy = {
                host: ip,
                port: parseInt(port),
                protocol: 'http'
            };
        }
        
        return config;
    }

    async checkRotationNeeds() {
        const now = Date.now();
        const timeSinceRotation = now - this.sessionData.lastRotation;
        const requestsInSession = this.sessionData.requestCount;
        
        // Rotate if time limit reached or too many requests
        if (timeSinceRotation > this.sessionData.rotationInterval || 
            requestsInSession > this.sessionData.maxRequestsPerSession) {
            
            console.log('🔄 Rotating session for anti-detection...');
            await this.rotateSession();
        }
    }

    async rotateSession() {
        // Rotate human behavior profile
        this.humanBehavior.rotateProfile();
        
        // Reset session data
        this.sessionData = {
            ...this.sessionData,
            requestCount: 0,
            lastRotation: Date.now(),
            maxRequestsPerSession: Math.floor(Math.random() * 50) + 20,
            rotationInterval: (Math.random() * 10 + 10) * 60 * 1000 // 10-20 minutes
        };
        
        // Add delay to simulate human behavior change
        await this.humanBehavior.humanDelay(2000, 5000);
        
        console.log('✅ Session rotated successfully');
    }

    updateSessionStats(response) {
        if (!this.sessionData.stats) {
            this.sessionData.stats = {
                responses: {
                    '2xx': 0,
                    '3xx': 0,
                    '4xx': 0,
                    '5xx': 0
                },
                totalResponseTime: 0,
                averageResponseTime: 0
            };
        }
        
        const statusCategory = Math.floor(response.status / 100) + 'xx';
        this.sessionData.stats.responses[statusCategory]++;
        
        // Update average response time (if available)
        if (response.config && response.config.metadata) {
            const responseTime = response.config.metadata.endTime - response.config.metadata.startTime;
            this.sessionData.stats.totalResponseTime += responseTime;
            this.sessionData.stats.averageResponseTime = 
                this.sessionData.stats.totalResponseTime / this.sessionData.requestCount;
        }
    }

    // Simulate realistic video watching with full anti-detection
    async simulateVideoWatch(videoUrl, duration = 60) {
        console.log(`🎥 Starting stealth video watch simulation...`);
        
        const watchPattern = await this.humanBehavior.simulateVideoWatching(duration);
        const results = [];
        
        for (const segment of watchPattern) {
            console.log(`📺 Watching segment ${segment.start}s - ${segment.end}s`);
            
            // Simulate watching
            const watchTime = (segment.end - segment.start) * 1000;
            await new Promise(resolve => setTimeout(resolve, watchTime));
            
            // Add random pause if needed
            if (segment.pauseChance > 0) {
                console.log(`⏸️ Human-like pause: ${Math.round(segment.pauseChance)}ms`);
                await new Promise(resolve => setTimeout(resolve, segment.pauseChance));
            }
            
            // Simulate interaction based on action
            if (segment.action === 'pause') {
                console.log('⏸️ Simulating pause action');
                await this.humanBehavior.humanDelay(1000, 3000);
            } else if (segment.action === 'seek') {
                console.log('⏩ Simulating seek action');
                await this.humanBehavior.humanDelay(500, 1500);
            }
            
            results.push({
                segment: segment.start,
                action: segment.action,
                completed: true
            });
        }
        
        console.log('✅ Video watch simulation completed');
        return results;
    }

    // Simulate realistic like action
    async simulateLike(videoUrl) {
        console.log('👍 Simulating like action...');
        
        // Human delay before liking
        await this.humanBehavior.humanDelay(1000, 5000);
        
        try {
            // Make stealth request to like endpoint (simulated)
            const response = await this.makeStealthRequest(videoUrl, {
                method: 'POST',
                data: { action: 'like' },
                humanDelay: false // Already delayed above
            });
            
            console.log('✅ Like action simulated successfully');
            return { success: true, response: response.status };
            
        } catch (error) {
            console.error('❌ Like simulation failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Simulate realistic comment with typing patterns
    async simulateComment(videoUrl, comment) {
        console.log('💬 Simulating comment action...');
        
        // Generate realistic typing pattern
        const typingPattern = this.humanBehavior.generateTypingPattern(comment);
        
        console.log(`⌨️ Simulating typing: "${comment.substring(0, 30)}..."`);
        
        // Simulate typing with realistic delays
        for (const keystroke of typingPattern) {
            await new Promise(resolve => setTimeout(resolve, keystroke.delay));
        }
        
        // Pause before submitting (human behavior)
        await this.humanBehavior.humanDelay(500, 2000);
        
        try {
            // Make stealth request to comment endpoint (simulated)
            const response = await this.makeStealthRequest(videoUrl, {
                method: 'POST',
                data: { 
                    action: 'comment',
                    text: comment,
                    timestamp: Date.now()
                },
                humanDelay: false
            });
            
            console.log('✅ Comment action simulated successfully');
            return { success: true, response: response.status, comment };
            
        } catch (error) {
            console.error('❌ Comment simulation failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Check if current time is optimal for bot activity
    isOptimalTime() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        
        // Check if current hour is in peak hours
        const isPeakHour = this.trafficPatterns.dailyPeaks.includes(hour);
        
        // Get weekly multiplier
        const weeklyMultiplier = this.trafficPatterns.weeklyPattern[day] || 0.8;
        
        // Calculate optimal score (0-1)
        const optimalScore = (isPeakHour ? 0.8 : 0.4) * weeklyMultiplier;
        
        return {
            optimal: optimalScore > 0.6,
            score: optimalScore,
            recommendation: optimalScore > 0.6 ? 'Good time for activity' : 'Consider waiting for peak hours'
        };
    }

    startRotationScheduler() {
        // Schedule regular rotations
        setInterval(async () => {
            if (this.sessionData.requestCount > 0) {
                console.log('🕒 Scheduled session rotation...');
                await this.rotateSession();
            }
        }, this.sessionData.rotationInterval);
        
        console.log('⏰ Auto-rotation scheduler started');
    }

    // Utility methods
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    sanitizeUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch {
            return url.substring(0, 50) + '...';
        }
    }

    // Get comprehensive stats
    getStats() {
        const proxyStats = this.proxyManager.getStats();
        const behaviorStats = this.humanBehavior.getStats();
        const timeOptimal = this.isOptimalTime();
        
        return {
            session: {
                uptime: Date.now() - this.sessionData.startTime,
                requests: this.sessionData.requestCount,
                lastRotation: new Date(this.sessionData.lastRotation).toISOString(),
                nextRotation: new Date(this.sessionData.lastRotation + this.sessionData.rotationInterval).toISOString()
            },
            proxy: proxyStats,
            behavior: behaviorStats,
            timing: timeOptimal,
            antiDetection: {
                rotationInterval: this.sessionData.rotationInterval / 60000 + ' minutes',
                maxRequestsPerSession: this.sessionData.maxRequestsPerSession,
                currentFingerprint: this.humanBehavior.currentProfile.canvas.hash
            }
        };
    }
}

module.exports = AntiDetectionManager;
