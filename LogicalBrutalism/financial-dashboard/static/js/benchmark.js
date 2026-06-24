(function() {
    // Isolated engineering benchmark scope
    
    const state = {
        js_bundle_kb: 0,
        css_bundle_kb: 0,
        assets_kb: 0,
        total_transfer_kb: 0,
        
        dom_nodes: 0,
        max_dom_depth: 0,
        interactive_elements: 0,
        
        heap_used_mb: 0,
        heap_total_mb: 0,
        peak_heap_mb: 0,
        
        request_count: 0,
        transferred_mb: 0,
        ws_messages: 0, // Not applicable in this HTTP polling architecture
        ws_received_mb: 0,
        
        dashboard_mount_ms: 0,
        widgets_render_ms: 0,
        charts_render_ms: 0,
        
        widgetUpdates: [],
        chartUpdates: [],
        
        // Codebase Meta
        direct_dependencies: 0,
        total_dependencies: 0,
        source_files: 0,
        lines_of_code: 0,
        component_count: 0,

        // internal flags
        firstWidgetRendered: false,
        firstChartRendered: false
    };

    // Math Utility
    const calcStats = (arr) => {
        if (!arr || arr.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
        const sorted = [...arr].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        return {
            avg: Number((sum / sorted.length).toFixed(1)),
            median: Number((sorted[Math.floor(sorted.length / 2)]).toFixed(1)),
            p95: Number((sorted[Math.floor(sorted.length * 0.95)]).toFixed(1)),
            max: Number((sorted[sorted.length - 1]).toFixed(1))
        };
    };

    // 1. Performance Observers (Network & Sizes)
    const setupObservers = () => {
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                state.request_count++;
                const sizeKb = (entry.transferSize || 0) / 1024;
                state.total_transfer_kb += sizeKb;
                
                if (entry.name.endsWith('.js') || entry.initiatorType === 'script') {
                    state.js_bundle_kb += sizeKb;
                } else if (entry.name.endsWith('.css') || entry.initiatorType === 'css') {
                    state.css_bundle_kb += sizeKb;
                } else {
                    state.assets_kb += sizeKb;
                }
            }
            state.transferred_mb = state.total_transfer_kb / 1024;
        }).observe({ type: 'resource', buffered: true });
    };

    // 2. Fetch Backend Metadata
    const fetchMeta = async () => {
        try {
            const res = await fetch('/api/benchmark-meta');
            const data = await res.json();
            Object.assign(state, data);
        } catch (e) {
            console.error('Benchmark Meta Error', e);
        }
    };

    // 3. DOM Analysis
    const getMaxDepth = (node) => {
        let max = 0;
        for (let child of node.children) {
            max = Math.max(max, getMaxDepth(child));
        }
        return max + 1;
    };

    const updateDomStats = () => {
        state.dom_nodes = document.querySelectorAll('*').length;
        state.max_dom_depth = getMaxDepth(document.documentElement);
        state.interactive_elements = document.querySelectorAll('a, button, input, select, textarea, [tabindex], [onclick], [hx-get], [hx-post]').length;
    };

    // 4. Memory Tracking
    const updateMemory = () => {
        if (performance.memory) {
            state.heap_used_mb = performance.memory.usedJSHeapSize / 1048576;
            state.heap_total_mb = performance.memory.totalJSHeapSize / 1048576;
            state.peak_heap_mb = Math.max(state.peak_heap_mb, state.heap_used_mb);
        }
    };

    // 5. HTMX Rendering Tracking
    const setupHtmxHooks = () => {
        const swapStartTimes = new Map();
        
        // Measure pure DOM rendering cost (excluding network latency)
        document.body.addEventListener('htmx:beforeSwap', (e) => {
            let path = '';
            if (e.detail && e.detail.requestConfig && e.detail.requestConfig.path) {
                path = e.detail.requestConfig.path;
            } else if (e.detail && e.detail.xhr && e.detail.xhr.responseURL) {
                path = e.detail.xhr.responseURL;
            }
            
            swapStartTimes.set(e.target, {
                start: performance.now(),
                path: path
            });
        });

        document.body.addEventListener('htmx:afterSettle', (e) => {
            const record = swapStartTimes.get(e.target);
            if (!record) return;
            
            const duration = performance.now() - record.start;
            const path = record.path;
            swapStartTimes.delete(e.target);

            if (path.includes('/api/quotes')) {
                if (!state.firstWidgetRendered) {
                    state.widgets_render_ms = Number(duration.toFixed(1));
                    state.firstWidgetRendered = true;
                } else {
                    state.widgetUpdates.push(duration);
                }
            } else if (path.includes('/api/detailed')) {
                if (!state.firstChartRendered) {
                    state.charts_render_ms = Number(duration.toFixed(1));
                    state.firstChartRendered = true;
                } else {
                    state.chartUpdates.push(duration);
                }
            }
        });
    };

    // 6. Fetch wrapping for Alpine Chart Updates
    const wrapFetch = () => {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const path = args[0];
            const isChartData = typeof path === 'string' && path.includes('/api/chart-data');
            
            let start;
            if (isChartData) start = performance.now();
            
            const res = await originalFetch.apply(this, args);
            
            if (isChartData && start) {
                // To accurately measure DOM processing cost we clone and wait for JSON parsing
                const clone = res.clone();
                clone.json().then(() => {
                    const duration = performance.now() - start;
                    state.chartUpdates.push(duration);
                }).catch(() => {});
            }
            return res;
        };
    };

    // 7. UI Panel
    let panel;
    const initPanel = () => {
        panel = document.createElement('div');
        panel.id = 'perf-benchmark-panel';
        Object.assign(panel.style, {
            position: 'fixed', bottom: '10px', right: '10px',
            backgroundColor: 'rgba(0,0,0,0.9)', color: '#0f0',
            fontFamily: 'monospace', fontSize: '11px', padding: '10px',
            border: '1px solid #0f0', zIndex: 999999,
            width: '320px', pointerEvents: 'auto',
            backdropFilter: 'blur(4px)'
        });
        
        panel.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #0f0; margin-bottom:5px; text-align:center;">ARCHITECTURAL BENCHMARK</div>
            <div style="display:flex; justify-content:space-between"><span>JS Bundle:</span><span id="bm-js"></span></div>
            <div style="display:flex; justify-content:space-between"><span>CSS Size:</span><span id="bm-css"></span></div>
            <div style="display:flex; justify-content:space-between"><span>DOM Nodes:</span><span id="bm-dom"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Max DOM Depth:</span><span id="bm-depth"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Interactive:</span><span id="bm-inter"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Heap Used:</span><span id="bm-mem"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Peak Heap:</span><span id="bm-peak"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Net Req / MB:</span><span id="bm-net"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Dashboard Mount:</span><span id="bm-mount"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Init Widgets Render:</span><span id="bm-wrender"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Init Charts Render:</span><span id="bm-crender"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Widget Upd (Avg):</span><span id="bm-wavg"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Widget Upd (P95):</span><span id="bm-wp95"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Lines of Code:</span><span id="bm-loc"></span></div>
            <div style="display:flex; justify-content:space-between"><span>Dependencies:</span><span id="bm-deps"></span></div>
            <button id="perf-export-btn" style="width:100%; margin-top:10px; background:#0f0; color:#000; border:none; padding:5px; cursor:pointer; font-weight:bold;">EXPORT JSON</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('perf-export-btn').addEventListener('click', exportBenchmark);
    };

    const updatePanel = () => {
        if (!panel) return;
        
        updateDomStats();
        updateMemory();

        const wStats = calcStats(state.widgetUpdates);

        document.getElementById('bm-js').textContent = `${state.js_bundle_kb.toFixed(1)} KB`;
        document.getElementById('bm-css').textContent = `${state.css_bundle_kb.toFixed(1)} KB`;
        document.getElementById('bm-dom').textContent = state.dom_nodes;
        document.getElementById('bm-depth').textContent = state.max_dom_depth;
        document.getElementById('bm-inter').textContent = state.interactive_elements;
        document.getElementById('bm-mem').textContent = `${state.heap_used_mb.toFixed(1)} MB`;
        document.getElementById('bm-peak').textContent = `${state.peak_heap_mb.toFixed(1)} MB`;
        document.getElementById('bm-net').textContent = `${state.request_count} / ${state.transferred_mb.toFixed(2)}`;
        document.getElementById('bm-mount').textContent = `${state.dashboard_mount_ms}ms`;
        document.getElementById('bm-wrender').textContent = `${state.widgets_render_ms}ms`;
        document.getElementById('bm-crender').textContent = `${state.charts_render_ms}ms`;
        document.getElementById('bm-wavg').textContent = `${wStats.avg}ms`;
        document.getElementById('bm-wp95').textContent = `${wStats.p95}ms`;
        document.getElementById('bm-loc').textContent = state.lines_of_code;
        document.getElementById('bm-deps').textContent = state.total_dependencies;
    };

    const exportBenchmark = () => {
        updateDomStats();
        updateMemory();

        const wStats = calcStats(state.widgetUpdates);
        const cStats = calcStats(state.chartUpdates);

        const payload = {
            js_bundle_kb: Number(state.js_bundle_kb.toFixed(1)),
            css_bundle_kb: Number(state.css_bundle_kb.toFixed(1)),
            assets_kb: Number(state.assets_kb.toFixed(1)),
            total_transfer_kb: Number(state.total_transfer_kb.toFixed(1)),
            
            dom_nodes: state.dom_nodes,
            max_dom_depth: state.max_dom_depth,
            interactive_elements: state.interactive_elements,
            
            heap_used_mb: Number(state.heap_used_mb.toFixed(1)),
            heap_total_mb: Number(state.heap_total_mb.toFixed(1)),
            peak_heap_mb: Number(state.peak_heap_mb.toFixed(1)),
            
            request_count: state.request_count,
            transferred_mb: Number(state.transferred_mb.toFixed(3)),
            ws_messages: state.ws_messages,
            ws_received_mb: state.ws_received_mb,
            
            dashboard_mount_ms: state.dashboard_mount_ms,
            widgets_render_ms: state.widgets_render_ms,
            charts_render_ms: state.charts_render_ms,
            
            widget_update_avg_ms: wStats.avg,
            widget_update_median_ms: wStats.median,
            widget_update_p95_ms: wStats.p95,
            widget_update_max_ms: wStats.max,
            
            chart_update_avg_ms: cStats.avg,
            chart_update_median_ms: cStats.median,
            chart_update_p95_ms: cStats.p95,
            chart_update_max_ms: cStats.max,
            
            direct_dependencies: state.direct_dependencies,
            total_dependencies: state.total_dependencies,
            
            source_files: state.source_files,
            lines_of_code: state.lines_of_code,
            component_count: state.component_count
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'logicalbrutalism-benchmark.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Initialization
    window.addEventListener('load', () => {
        if (performance.timing) {
            state.dashboard_mount_ms = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        } else {
            const p = performance.getEntriesByType('navigation')[0];
            if (p) state.dashboard_mount_ms = Math.round(p.domContentLoadedEventEnd);
        }

        setTimeout(() => {
            initPanel();
            setupObservers();
            setupHtmxHooks();
            wrapFetch();
            fetchMeta();
            
            // Interval to update UI passively without locking to RAF
            setInterval(updatePanel, 500);
        }, 100);
    });

})();
