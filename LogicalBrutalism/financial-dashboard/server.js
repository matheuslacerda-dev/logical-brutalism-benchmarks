import express from 'express';
import YahooFinance from 'yahoo-finance2';
import path from 'path';
import fs from 'fs';
const yahooFinance = new YahooFinance();
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "static" directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Define symbols to track
const SYMBOLS = ['AAPL', 'TSLA', 'SPY', 'BTC-USD', 'NVDA', 'AMZN', 'MSFT', 'META'];

// Format currency
const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

// API Endpoint for HTMX
app.get('/api/quotes', async (req, res) => {
    try {
        const quotes = await yahooFinance.quote(SYMBOLS);
        
        let html = '';
        quotes.forEach(quote => {
            const price = quote.regularMarketPrice;
            const change = quote.regularMarketChangePercent;
            
            // In brutalism, avoid typical green unless very stark, we use a harsh lime or just keep it simple.
            // Let's use a stark neon green for positive and the theme's lb-error for negative
            const changeClass = change >= 0 ? 'text-[#00ff00]' : 'text-lb-error';
            const changeSign = change >= 0 ? '+' : '';
            const changeText = change !== undefined ? `${changeSign}${change.toFixed(2)}%` : 'N/A';
            
            html += `
            <div 
                class="border border-lb-surface bg-lb-void p-4 flex flex-col justify-between hover:border-lb-white hover:bg-[#111] cursor-crosshair transition-colors duration-200"
                hx-get="/api/detailed/${quote.symbol}?t=${Date.now()}"
                hx-target="#detailed-view"
                hx-swap="innerHTML"
                onclick="setTimeout(() => document.getElementById('detailed-view').scrollIntoView({behavior:'smooth', block:'start'}), 300)"
            >
                <div class="flex justify-between items-start mb-4">
                    <h2 class="font-code text-lb-amber text-xl tracking-wider uppercase font-bold">${quote.symbol}</h2>
                    <div class="font-code text-xs uppercase px-2 py-1 border border-lb-surface bg-lb-void text-lb-text">LIVE</div>
                </div>
                <div>
                    <p class="font-struct text-lb-text text-xs uppercase truncate mb-2">${quote.shortName || quote.longName || 'Unknown Asset'}</p>
                    <div class="flex justify-between items-end">
                        <div class="font-code text-2xl text-lb-white">${formatCurrency(price)}</div>
                        <div class="font-code text-sm ${changeClass}">
                            ${changeText}
                        </div>
                    </div>
                </div>
                <!-- Sparkline Chart -->
                <div class="mt-3 h-12 w-full border-t border-lb-surface pt-2 overflow-hidden opacity-80">
                    <img src="/api/sparkline/${quote.symbol}" alt="${quote.symbol} chart" class="w-full h-full object-fill pointer-events-none" />
                </div>
            </div>
            `;
        });
        
        // Add a timestamp
        const time = new Date().toLocaleTimeString();
        html += `
            <div class="col-span-full mt-4 border-t border-lb-surface pt-2 flex justify-between items-center">
                <p class="font-code text-xs text-lb-amber animate-pulse">[STREAM_ACTIVE]</p>
                <p class="font-code text-xs text-lb-text">LAST_SYNC :: ${time}</p>
            </div>
        `;
        
        res.send(html);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).send('<div class="col-span-full text-lb-error font-code p-4 border border-lb-error bg-black">SYS_ERR: Upstream data failure. Retrying...</div>');
    }
});

// API Endpoint for Sparklines (Historical Data)
app.get('/api/sparkline/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days
        const data = await yahooFinance.chart(symbol, { period1 });
        const closes = data.quotes.map(q => q.close).filter(c => c !== null && c !== undefined);
        
        if (closes.length === 0) {
            return res.status(404).send('');
        }

        const min = Math.min(...closes);
        const max = Math.max(...closes);
        const range = max - min || 1;
        
        const width = 200;
        const height = 40;
        
        const points = closes.map((val, i) => {
            const x = (i / (closes.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const color = closes[closes.length - 1] >= closes[0] ? '#00ff00' : '#ff003c'; // Brutalist red is usually #ff003c or similar, matching text-lb-error

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -5 ${width} ${height + 10}" width="100%" height="100%" preserveAspectRatio="none">
            <polyline fill="none" stroke="${color}" stroke-width="2" points="${points}" />
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour to prevent hitting rate limits
        res.send(svg);
    } catch (error) {
        console.error('Error fetching chart data for ' + req.params.symbol + ':', error.message);
        res.status(500).send('');
    }
});

// API Endpoint for Detailed View Component
app.get('/api/detailed/:symbol', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const symbol = req.params.symbol;
    
    const html = `
    <div class="p-6 relative" x-data="{
        symbol: '${symbol}',
        range: '1mo',
        loading: true,
        async initChart() {
            try {
                const container = this.$refs.chartContainer;
                if (container._chart) return;
                
                await new Promise(r => setTimeout(r, 100));
                
                if (typeof LightweightCharts === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                container._chart = LightweightCharts.createChart(container, {
                    layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#ffffff', fontFamily: 'Iosevka, monospace' },
                    grid: { vertLines: { color: 'rgba(255, 255, 255, 0.1)' }, horzLines: { color: 'rgba(255, 255, 255, 0.1)' } },
                    crosshair: { mode: LightweightCharts.CrosshairMode.Normal, vertLine: { width: 1, color: '#ffab00', style: 0 }, horzLine: { width: 1, color: '#ffab00', style: 0 } },
                    timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
                    rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' }
                });
                
                container._series = container._chart.addAreaSeries({
                    lineColor: '#ffab00',
                    topColor: 'rgba(255, 171, 0, 0.4)',
                    bottomColor: 'rgba(255, 171, 0, 0.0)',
                    lineWidth: 2,
                    crosshairMarkerRadius: 4,
                });
                
                container._chart.subscribeCrosshairMove((param) => {
                    const tooltip = this.$refs.tooltip;
                    if (
                        param.point === undefined ||
                        !param.time ||
                        param.point.x < 0 ||
                        param.point.x > container.clientWidth ||
                        param.point.y < 0 ||
                        param.point.y > container.clientHeight
                    ) {
                        tooltip.classList.add('hidden');
                    } else {
                        const price = param.seriesData.get(container._series);
                        if (price !== undefined) {
                            tooltip.classList.remove('hidden');
                            tooltip.innerHTML = '$' + price.value.toFixed(2);
                            tooltip.style.left = param.point.x + 'px';
                            tooltip.style.top = (param.point.y - 15) + 'px'; // slightly above the dot
                        }
                    }
                });
                
                await this.fetchData();
            } catch (e) {
                console.error('Error init:', e);
                this.$refs.chartContainer.innerHTML = '<div class=\\'text-lb-error p-4 border border-lb-error\\'>SYS_ERR: ' + e.message + '</div>';
                this.loading = false;
            }
        },
        async setRange(newRange) {
            this.range = newRange;
            await this.fetchData();
        },
        async fetchData() {
            this.loading = true;
            try {
                const res = await fetch('/api/chart-data/' + this.symbol + '?range=' + this.range);
                const data = await res.json();
                if (data && data.length > 0) {
                    const container = this.$refs.chartContainer;
                    if (container._series) {
                        container._series.setData(data);
                        container._chart.timeScale().fitContent();
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                this.loading = false;
            }
        }
    }" x-init="initChart()">
        <div class="flex justify-between items-end mb-6 border-b border-lb-surface pb-4">
            <div>
                <h2 class="font-code text-lb-amber text-3xl font-bold tracking-wider uppercase">${symbol} :: DETAILED_ANALYSIS</h2>
            </div>
            <div class="flex gap-2 font-code text-xs">
                <button @click="setRange('1w')" :class="range === '1w' ? 'bg-lb-white text-lb-void' : 'bg-lb-void text-lb-white'" class="px-3 py-1 border border-lb-surface hover:border-lb-amber">1W</button>
                <button @click="setRange('1mo')" :class="range === '1mo' ? 'bg-lb-white text-lb-void' : 'bg-lb-void text-lb-white'" class="px-3 py-1 border border-lb-surface hover:border-lb-amber">1M</button>
                <button @click="setRange('6mo')" :class="range === '6mo' ? 'bg-lb-white text-lb-void' : 'bg-lb-void text-lb-white'" class="px-3 py-1 border border-lb-surface hover:border-lb-amber">6M</button>
                <button @click="setRange('1y')" :class="range === '1y' ? 'bg-lb-white text-lb-void' : 'bg-lb-void text-lb-white'" class="px-3 py-1 border border-lb-surface hover:border-lb-amber">1Y</button>
            </div>
        </div>
        
        <div class="relative w-full h-[400px]">
            <!-- Loading Overlay -->
            <div x-show="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-lb-void bg-opacity-80 font-code text-lb-amber animate-pulse border border-lb-surface">
                [RETRIEVING_CHART_MATRIX...]
            </div>

            <!-- Chart Container -->
            <div x-ref="chartContainer" class="w-full h-full relative"></div>
            
            <!-- Floating Tooltip -->
            <div x-ref="tooltip" class="absolute hidden z-20 pointer-events-none bg-lb-void border border-lb-amber px-2 py-1 font-code text-lb-white text-sm shadow-md transition-transform" style="transform: translate(-50%, -100%);"></div>
        </div>
    </div>
    `;
    res.send(html);
});

// API Endpoint for Chart JSON Data
app.get('/api/chart-data/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const range = req.query.range || '1mo';
        
        let days = 30;
        let interval = '1d';
        
        if (range === '1w') {
            days = 7;
            interval = '15m';
        } else if (range === '6mo') {
            days = 180;
            interval = '1d';
        } else if (range === '1y') {
            days = 365;
            interval = '1d';
        }
        
        const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const data = await yahooFinance.chart(symbol, { period1, interval });
        
        const formattedData = data.quotes
            .filter(q => q.close !== null && q.close !== undefined && q.date)
            .map(q => ({
                time: Math.floor(new Date(q.date).getTime() / 1000),
                value: q.close
            }));
            
        // Lightweight charts requires data to be strictly sorted by time
        formattedData.sort((a, b) => a.time - b.time);
        
        // Remove duplicates if any (same timestamp)
        const uniqueData = formattedData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
        
        res.json(uniqueData);
    } catch (error) {
        console.error('Error fetching JSON chart data:', error);
        res.status(500).json([]);
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Benchmark Meta Endpoint
app.get('/api/benchmark-meta', (req, res) => {
    const root = __dirname;
    let direct_dependencies = 0;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
    } catch(e) {}

    let total_dependencies = 0;
    try {
        const nm = path.join(root, 'node_modules');
        const traverseNM = (dir) => {
            const files = fs.readdirSync(dir, {withFileTypes: true});
            for (let f of files) {
                if (f.isDirectory() && !f.name.startsWith('.')) {
                    if (f.name.startsWith('@')) {
                        traverseNM(path.join(dir, f.name));
                    } else {
                        total_dependencies++;
                        traverseNM(path.join(dir, f.name));
                    }
                }
            }
        };
        traverseNM(nm);
    } catch(e) {}

    let source_files = 0;
    let lines_of_code = 0;
    let component_count = 0;

    const traverseSrc = (dir) => {
        const files = fs.readdirSync(dir, {withFileTypes: true});
        for (let f of files) {
            if (f.isDirectory()) {
                if (!['node_modules', '.git', '.gemini', 'static'].includes(f.name) || f.name === 'static') {
                    traverseSrc(path.join(dir, f.name));
                }
            } else if (f.isFile() && f.name.match(/\.(js|html|css)$/)) {
                source_files++;
                const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
                lines_of_code += content.split('\n').length;
                
                const xDataMatches = content.match(/x-data=/g);
                if (xDataMatches) component_count += xDataMatches.length;
                
                const htmlEndpointMatches = content.match(/res\.send\(/g);
                if (htmlEndpointMatches) component_count += htmlEndpointMatches.length;
            }
        }
    };
    try { traverseSrc(root); } catch(e) {}

    res.json({
        direct_dependencies,
        total_dependencies,
        source_files,
        lines_of_code,
        component_count
    });
});

app.listen(PORT, () => {
    console.log(`[SYS_START] Server running on port ${PORT}`);
});
