/**
 * Human Behavior Simulator - Mensimulasikan perilaku manusia untuk anti-deteksi
 * Termasuk user agent, timezone, canvas fingerprint, WebRTC, dll
 */

const crypto = require('crypto');

class HumanBehaviorSimulator {
    constructor() {
        // Database user agents real
        this.userAgents = [
            // Windows Chrome
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            // Windows Firefox
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
            // Windows Edge
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            // MacOS Safari
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // Linux
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
            // Mobile
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        ];

        // Timezone data dengan kota-kota besar
        this.timezones = [
            { zone: 'America/New_York', offset: -5, country: 'US', city: 'New York' },
            { zone: 'America/Los_Angeles', offset: -8, country: 'US', city: 'Los Angeles' },
            { zone: 'America/Chicago', offset: -6, country: 'US', city: 'Chicago' },
            { zone: 'Europe/London', offset: 0, country: 'GB', city: 'London' },
            { zone: 'Europe/Paris', offset: 1, country: 'FR', city: 'Paris' },
            { zone: 'Europe/Berlin', offset: 1, country: 'DE', city: 'Berlin' },
            { zone: 'Asia/Tokyo', offset: 9, country: 'JP', city: 'Tokyo' },
            { zone: 'Asia/Shanghai', offset: 8, country: 'CN', city: 'Shanghai' },
            { zone: 'Asia/Seoul', offset: 9, country: 'KR', city: 'Seoul' },
            { zone: 'Asia/Singapore', offset: 8, country: 'SG', city: 'Singapore' },
            { zone: 'Asia/Jakarta', offset: 7, country: 'ID', city: 'Jakarta' },
            { zone: 'Australia/Sydney', offset: 10, country: 'AU', city: 'Sydney' },
            { zone: 'America/Sao_Paulo', offset: -3, country: 'BR', city: 'São Paulo' },
            { zone: 'Asia/Mumbai', offset: 5.5, country: 'IN', city: 'Mumbai' }
        ];

        // Screen resolutions yang umum
        this.screenResolutions = [
            { width: 1920, height: 1080, ratio: '16:9' },
            { width: 1366, height: 768, ratio: '16:9' },
            { width: 1536, height: 864, ratio: '16:9' },
            { width: 1440, height: 900, ratio: '16:10' },
            { width: 1280, height: 720, ratio: '16:9' },
            { width: 2560, height: 1440, ratio: '16:9' },
            { width: 3840, height: 2160, ratio: '16:9' },
            { width: 1600, height: 900, ratio: '16:9' },
            { width: 1280, height: 1024, ratio: '5:4' },
            { width: 1024, height: 768, ratio: '4:3' }
        ];

        // Inisialisasi profile
        this.currentProfile = this.generateProfile();
        
        console.log('🤖 Human Behavior Simulator initialized');
        console.log(`👤 Current profile: ${this.currentProfile.location.city}, ${this.currentProfile.location.country}`);
    }

    generateProfile() {
        const timezone = this.getRandomItem(this.timezones);
        const userAgent = this.getRandomItem(this.userAgents);
        const screen = this.getRandomItem(this.screenResolutions);
        
        return {
            userAgent: userAgent,
            timezone: timezone,
            screen: screen,
            location: {
                country: timezone.country,
                city: timezone.city,
                latitude: this.generateRandomCoordinate(-90, 90),
                longitude: this.generateRandomCoordinate(-180, 180)
            },
            browser: this.extractBrowserInfo(userAgent),
            canvas: this.generateCanvasFingerprint(),
            webrtc: this.generateWebRTCFingerprint(),
            fonts: this.generateFontList(),
            plugins: this.generatePluginList(),
            languages: this.generateLanguages(timezone.country),
            cookiesEnabled: true,
            doNotTrack: Math.random() > 0.7 ? '1' : '0',
            sessionId: this.generateSessionId(),
            created: new Date().toISOString()
        };
    }

    extractBrowserInfo(userAgent) {
        let browser = 'Chrome';
        let version = '120.0.0.0';
        let os = 'Windows';

        if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
            version = match ? match[1] + '.0' : '120.0';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
            const match = userAgent.match(/Version\/(\d+\.\d+)/);
            version = match ? match[1] : '17.1';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
            const match = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
            version = match ? match[1] : '120.0.0.0';
        }

        if (userAgent.includes('Mac OS X')) os = 'MacOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iPhone')) os = 'iOS';

        return { name: browser, version, os };
    }

    generateCanvasFingerprint() {
        // Simulasi canvas fingerprint yang unik
        const baseString = `canvas_${this.currentProfile?.sessionId || Date.now()}_${Math.random()}`;
        return {
            hash: crypto.createHash('md5').update(baseString).digest('hex').substring(0, 16),
            supported: true,
            webgl: {
                vendor: this.getRandomItem(['Google Inc.', 'Mozilla', 'WebKit']),
                renderer: this.getRandomItem([
                    'ANGLE (Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)',
                    'WebKit WebGL'
                ])
            }
        };
    }

    generateWebRTCFingerprint() {
        return {
            supported: true,
            localIP: this.generateLocalIP(),
            publicIP: null, // Will be filled by proxy
            stunServers: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        };
    }

    generateLocalIP() {
        // Generate realistic local IP
        const ranges = [
            '192.168.1',
            '192.168.0',
            '10.0.0',
            '172.16.0'
        ];
        const range = this.getRandomItem(ranges);
        const last = Math.floor(Math.random() * 254) + 1;
        return `${range}.${last}`;
    }

    generateFontList() {
        const commonFonts = [
            'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
            'Tahoma', 'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS',
            'Palatino Linotype', 'Lucida Sans Unicode', 'MS Sans Serif',
            'Courier New', 'Lucida Console'
        ];

        // Return 8-12 random fonts
        const count = Math.floor(Math.random() * 5) + 8;
        return this.shuffleArray([...commonFonts]).slice(0, count);
    }

    generatePluginList() {
        const plugins = [];
        
        // Common plugins berdasarkan browser
        if (this.currentProfile?.browser?.name === 'Chrome') {
            plugins.push(
                'Chrome PDF Plugin',
                'Native Client',
                'Widevine Content Decryption Module'
            );
        } else if (this.currentProfile?.browser?.name === 'Firefox') {
            plugins.push(
                'PDF.js',
                'OpenH264 Video Codec'
            );
        }

        return plugins;
    }

    generateLanguages(country) {
        const languageMap = {
            'US': ['en-US', 'en'],
            'GB': ['en-GB', 'en'],
            'DE': ['de-DE', 'de', 'en'],
            'FR': ['fr-FR', 'fr', 'en'],
            'JP': ['ja-JP', 'ja', 'en'],
            'CN': ['zh-CN', 'zh', 'en'],
            'KR': ['ko-KR', 'ko', 'en'],
            'ID': ['id-ID', 'id', 'en'],
            'BR': ['pt-BR', 'pt', 'en'],
            'IN': ['hi-IN', 'en-IN', 'en']
        };

        return languageMap[country] || ['en-US', 'en'];
    }

    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    generateRandomCoordinate(min, max) {
        return (Math.random() * (max - min) + min).toFixed(6);
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Simulate human-like delays
    async humanDelay(minMs = 500, maxMs = 3000) {
        const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
        
        // Add natural variation (sometimes longer pauses)
        const variation = Math.random() > 0.9 ? Math.random() * 2000 : 0;
        
        const totalDelay = delay + variation;
        console.log(`⏳ Human-like delay: ${Math.round(totalDelay)}ms`);
        
        return new Promise(resolve => setTimeout(resolve, totalDelay));
    }

    // Simulate human reading patterns
    calculateReadingTime(text, wordsPerMinute = 200) {
        const words = text.split(' ').length;
        const minutes = words / wordsPerMinute;
        const baseTime = minutes * 60 * 1000; // Convert to milliseconds
        
        // Add randomness (±30%)
        const variation = baseTime * 0.3 * (Math.random() - 0.5);
        return Math.max(1000, baseTime + variation); // Minimum 1 second
    }

    // Simulate human-like mouse movements (for future use)
    generateMousePath(fromX, fromY, toX, toY) {
        const steps = [];
        const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
        const stepCount = Math.max(3, Math.floor(distance / 20));
        
        for (let i = 0; i <= stepCount; i++) {
            const progress = i / stepCount;
            
            // Add bezier curve for natural movement
            const bezierProgress = this.bezierEasing(progress);
            
            const x = fromX + (toX - fromX) * bezierProgress + (Math.random() - 0.5) * 5;
            const y = fromY + (toY - fromY) * bezierProgress + (Math.random() - 0.5) * 5;
            
            steps.push({
                x: Math.round(x),
                y: Math.round(y),
                delay: Math.random() * 20 + 10
            });
        }
        
        return steps;
    }

    bezierEasing(t) {
        // Cubic bezier easing for natural movement
        return t * t * (3.0 - 2.0 * t);
    }

    // Generate realistic typing patterns
    generateTypingPattern(text) {
        const pattern = [];
        const averageWPM = 40; // Average typing speed
        const baseDelay = 60000 / (averageWPM * 5); // Convert WPM to ms per character
        
        for (let i = 0; i < text.length; i++) {
            let delay = baseDelay;
            
            // Add variations based on character type
            if (text[i] === ' ') delay *= 1.5; // Longer pause for spaces
            if (text[i].match(/[.!?]/)) delay *= 3; // Longer pause after sentences
            if (text[i].match(/[A-Z]/)) delay *= 1.2; // Slightly longer for capitals
            if (text[i].match(/[0-9]/)) delay *= 1.1; // Slightly longer for numbers
            
            // Add random variation (±40%)
            delay *= (0.6 + Math.random() * 0.8);
            
            // Occasional longer pauses (thinking)
            if (Math.random() > 0.95) delay *= 3;
            
            pattern.push({
                char: text[i],
                delay: Math.round(delay)
            });
        }
        
        return pattern;
    }

    // Generate new profile (rotate identity)
    rotateProfile() {
        this.currentProfile = this.generateProfile();
        console.log(`🔄 Profile rotated to: ${this.currentProfile.location.city}, ${this.currentProfile.location.country}`);
        return this.currentProfile;
    }

    // Get current profile for headers
    getHttpHeaders() {
        return {
            'User-Agent': this.currentProfile.userAgent,
            'Accept-Language': this.currentProfile.languages.join(','),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': this.currentProfile.doNotTrack,
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        };
    }

    // Get fingerprint data for requests
    getFingerprint() {
        return {
            userAgent: this.currentProfile.userAgent,
            screen: this.currentProfile.screen,
            timezone: this.currentProfile.timezone.zone,
            language: this.currentProfile.languages[0],
            canvas: this.currentProfile.canvas.hash,
            webgl: this.currentProfile.canvas.webgl,
            fonts: this.currentProfile.fonts,
            plugins: this.currentProfile.plugins,
            cookieEnabled: this.currentProfile.cookiesEnabled,
            doNotTrack: this.currentProfile.doNotTrack
        };
    }

    // Simulate human-like video watching behavior
    async simulateVideoWatching(duration) {
        const segments = Math.ceil(duration / 10); // 10-second segments
        const watchPattern = [];
        
        for (let i = 0; i < segments; i++) {
            const segment = {
                start: i * 10,
                end: Math.min((i + 1) * 10, duration),
                action: this.getRandomVideoAction(),
                pauseChance: Math.random() > 0.85 ? Math.random() * 5000 : 0
            };
            
            watchPattern.push(segment);
        }
        
        return watchPattern;
    }

    getRandomVideoAction() {
        const actions = [
            'watch', 'watch', 'watch', 'watch', 'watch', // Most common
            'pause', 'seek', 'volume_change', 'fullscreen_toggle'
        ];
        
        return this.getRandomItem(actions);
    }

    // Get stats about current behavior
    getStats() {
        return {
            profile: {
                browser: this.currentProfile.browser,
                location: this.currentProfile.location,
                timezone: this.currentProfile.timezone.zone,
                language: this.currentProfile.languages[0],
                screen: `${this.currentProfile.screen.width}x${this.currentProfile.screen.height}`,
                created: this.currentProfile.created
            },
            fingerprint: {
                canvas: this.currentProfile.canvas.hash,
                webrtc: this.currentProfile.webrtc.localIP,
                fonts: this.currentProfile.fonts.length,
                plugins: this.currentProfile.plugins.length
            }
        };
    }
}

module.exports = HumanBehaviorSimulator;
