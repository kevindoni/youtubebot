/**
 * Proxy Manager - Mengelola proxy gratis untuk bot
 * Mengambil proxy dari berbagai sumber gratis
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ProxyManager {    constructor(options = {}) {
        this.options = options;
        this.proxies = [];
        this.workingProxies = [];
        this.currentProxyIndex = 0;
        this.proxyCheckInterval = 30 * 60 * 1000; // 30 menit
        this.maxRetries = 3;
        this.proxyFile = path.join(__dirname, 'data', 'proxies.json');
        
        // Sumber proxy gratis
        this.proxySources = [
            'https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
            'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
            'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
        ];
        
        this.init();
    }

    async init() {
        try {
            // Buat direktori data jika belum ada
            await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
            
            // Load proxy dari file jika ada
            await this.loadProxiesFromFile();
            
            // Fetch proxy baru jika belum ada
            if (this.proxies.length === 0) {
                await this.fetchProxies();
            }
            
            // Start proxy checking interval
            this.startProxyChecker();
            
            console.log(`🌐 Proxy Manager initialized with ${this.proxies.length} proxies`);
        } catch (error) {
            console.error('❌ Error initializing Proxy Manager:', error.message);
        }
    }

    async fetchProxies() {
        console.log('🔄 Fetching fresh proxies...');
        const allProxies = new Set();

        for (const source of this.proxySources) {
            try {
                console.log(`📡 Fetching from: ${source}`);
                const response = await axios.get(source, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const proxies = this.parseProxyResponse(response.data);
                proxies.forEach(proxy => allProxies.add(proxy));
                
                console.log(`✅ Found ${proxies.length} proxies from source`);
            } catch (error) {
                console.log(`⚠️ Failed to fetch from source: ${error.message}`);
            }
        }

        this.proxies = Array.from(allProxies).map(proxy => ({
            address: proxy,
            working: null,
            lastChecked: null,
            responseTime: null,
            country: null,
            anonymity: null
        }));

        console.log(`🌐 Total proxies collected: ${this.proxies.length}`);
        await this.saveProxiesToFile();
        await this.validateProxies();
    }

    parseProxyResponse(data) {
        const proxies = [];
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && this.isValidProxy(trimmed)) {
                proxies.push(trimmed);
            }
        }
        
        return proxies;
    }

    isValidProxy(proxy) {
        const proxyRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})$/;
        return proxyRegex.test(proxy);
    }

    async validateProxies() {
        console.log('🔍 Validating proxies...');
        const testUrl = 'http://httpbin.org/ip';
        const batchSize = 50;
        
        for (let i = 0; i < this.proxies.length; i += batchSize) {
            const batch = this.proxies.slice(i, i + batchSize);
            const promises = batch.map(proxy => this.testProxy(proxy, testUrl));
            
            await Promise.allSettled(promises);
            
            // Progress update
            const progress = Math.min(i + batchSize, this.proxies.length);
            console.log(`📊 Validated ${progress}/${this.proxies.length} proxies`);
        }

        this.workingProxies = this.proxies.filter(proxy => proxy.working);
        console.log(`✅ Found ${this.workingProxies.length} working proxies`);
        
        await this.saveProxiesToFile();
    }

    async testProxy(proxyObj, testUrl) {
        const startTime = Date.now();
        
        try {
            const [ip, port] = proxyObj.address.split(':');
            const response = await axios.get(testUrl, {
                proxy: {
                    host: ip,
                    port: parseInt(port)
                },
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            proxyObj.working = true;
            proxyObj.responseTime = Date.now() - startTime;
            proxyObj.lastChecked = new Date().toISOString();
            
            // Try to detect country and anonymity
            if (response.data && response.data.origin) {
                proxyObj.anonymity = response.data.origin.includes(',') ? 'transparent' : 'anonymous';
            }

        } catch (error) {
            proxyObj.working = false;
            proxyObj.lastChecked = new Date().toISOString();
        }
    }

    getRandomProxy() {
        if (this.workingProxies.length === 0) {
            return null;
        }

        // Pilih proxy secara random dengan preferensi yang lebih cepat
        const fastProxies = this.workingProxies
            .filter(p => p.responseTime && p.responseTime < 3000)
            .sort((a, b) => a.responseTime - b.responseTime);

        if (fastProxies.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(10, fastProxies.length));
            return fastProxies[randomIndex];
        }

        // Fallback ke proxy random
        const randomIndex = Math.floor(Math.random() * this.workingProxies.length);
        return this.workingProxies[randomIndex];
    }

    getNextProxy() {
        if (this.workingProxies.length === 0) {
            return null;
        }

        const proxy = this.workingProxies[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.workingProxies.length;
        return proxy;
    }

    async saveProxiesToFile() {
        try {
            const data = {
                proxies: this.proxies,
                lastUpdated: new Date().toISOString(),
                workingCount: this.workingProxies.length
            };
            
            await fs.writeFile(this.proxyFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error saving proxies:', error.message);
        }
    }

    async loadProxiesFromFile() {
        try {
            const data = await fs.readFile(this.proxyFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Check if data is recent (less than 1 hour old)
            const lastUpdated = new Date(parsed.lastUpdated);
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            if (lastUpdated > hourAgo) {
                this.proxies = parsed.proxies || [];
                this.workingProxies = this.proxies.filter(p => p.working);
                console.log(`📂 Loaded ${this.proxies.length} proxies from file`);
            }
        } catch (error) {
            console.log('📂 No existing proxy file found, will fetch fresh proxies');
        }
    }

    startProxyChecker() {
        setInterval(async () => {
            console.log('🔄 Running periodic proxy check...');
            await this.fetchProxies();
        }, this.proxyCheckInterval);
    }

    getStats() {
        return {
            total: this.proxies.length,
            working: this.workingProxies.length,
            lastUpdated: this.proxies.length > 0 ? this.proxies[0].lastChecked : null,
            averageResponseTime: this.workingProxies.length > 0 
                ? Math.round(this.workingProxies.reduce((sum, p) => sum + (p.responseTime || 0), 0) / this.workingProxies.length)
                : 0
        };
    }

    // Method untuk HTTP requests dengan proxy
    async makeRequest(url, options = {}) {
        const proxy = this.getRandomProxy();
        if (!proxy) {
            throw new Error('No working proxies available');
        }

        const [ip, port] = proxy.address.split(':');
        
        try {
            const response = await axios({
                url,
                method: options.method || 'GET',
                data: options.data,
                headers: options.headers,
                proxy: {
                    host: ip,
                    port: parseInt(port)
                },
                timeout: options.timeout || 10000,
                ...options.axiosConfig
            });

            return response;
        } catch (error) {
            // Mark proxy as potentially broken
            proxy.working = false;
            throw error;
        }
    }
}

module.exports = ProxyManager;
