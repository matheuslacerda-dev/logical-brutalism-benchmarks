'use client';

import React, { useEffect, useState, useRef } from 'react';

interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export function PerformancePanel() {
  const [metrics, setMetrics] = useState<any>(null);
  
  const metricsRef = useRef({
    jsBytes: 0,
    cssBytes: 0,
    assetBytes: 0,
    domNodes: 0,
    maxDomDepth: 0,
    interactiveElements: 0,
    memoryCurrent: 0,
    memoryTotal: 0,
    memoryPeak: 0,
    networkRequests: 0,
    networkTransferredBytes: 0,
    wsMessages: 0,
    wsReceivedBytes: 0,
    widgetRefreshTimes: [] as number[],
    chartRefreshTimes: [] as number[],
    
    directDependencies: 0,
    totalDependencies: 0,
    sourceFiles: 0,
    linesOfCode: 0,
    componentCount: 0
  });

  const getPercentile = (arr: number[], q: number) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };

  const getAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const getMax = (arr: number[]) => arr.length ? Math.max(...arr) : 0;

  const calculateMaxDepth = (element: Element): number => {
    let max = 0;
    for (let i = 0; i < element.children.length; i++) {
      const depth = calculateMaxDepth(element.children[i]);
      if (depth > max) max = depth;
    }
    return max + 1;
  };

  useEffect(() => {
    const state = metricsRef.current;
    let pollIntervalId: NodeJS.Timeout;
    const observers: PerformanceObserver[] = [];
    let originalFetch: typeof window.fetch;

    fetch('/api/benchmark-stats').then(res => res.json()).then(data => {
      state.directDependencies = data.directDependencies || 0;
      state.totalDependencies = data.totalDependencies || 0;
      state.sourceFiles = data.sourceFiles || 0;
      state.linesOfCode = data.linesOfCode || 0;
      state.componentCount = data.componentCount || 0;
    }).catch(() => {});

    try {
      const resourceObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          state.networkRequests++;
          const size = entry.transferSize || 0;
          state.networkTransferredBytes += size;
          if (entry.initiatorType === 'script') state.jsBytes += size;
          else if (entry.initiatorType === 'link' || entry.name.endsWith('.css')) state.cssBytes += size;
          else if (['img', 'css', 'font'].includes(entry.initiatorType)) state.assetBytes += size;
        }
      });
      resourceObs.observe({ type: 'resource', buffered: true });
      observers.push(resourceObs);
    } catch (e) {}

    originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        if (url.includes('/api/quote')) state.widgetRefreshTimes.push(duration);
        else if (url.includes('/api/chart')) state.chartRefreshTimes.push(duration);
        return response;
      } catch (err) {
        throw err;
      }
    };

    pollIntervalId = setInterval(() => {
      state.domNodes = document.getElementsByTagName('*').length;
      state.maxDomDepth = calculateMaxDepth(document.body);
      state.interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length;

      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        const memMB = perf.memory.usedJSHeapSize / (1024 * 1024);
        state.memoryCurrent = memMB;
        state.memoryTotal = perf.memory.totalJSHeapSize / (1024 * 1024);
        if (memMB > state.memoryPeak) state.memoryPeak = memMB;
      }
      setMetrics({ ...state });
    }, 1000);

    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
      observers.forEach(obs => { try { obs.disconnect(); } catch (e) {} });
      if (originalFetch) window.fetch = originalFetch;
    };
  }, []);

  const handleExport = () => {
    const s = metricsRef.current;
    
    const getMeasure = (name: string) => {
      const entries = performance.getEntriesByName(name, 'measure');
      return entries.length ? entries[entries.length - 1].duration : 0;
    };

    const dashboardMount = getMeasure('dashboard_mount_duration');
    const widgetsRender = getMeasure('widgets_render_duration');
    const chartsRender = getMeasure('charts_render_duration');

    const totalTransferKb = (s.networkTransferredBytes / 1024);

    const output = {
      js_bundle_kb: Number((s.jsBytes / 1024).toFixed(2)),
      css_bundle_kb: Number((s.cssBytes / 1024).toFixed(2)),
      assets_kb: Number((s.assetBytes / 1024).toFixed(2)),
      total_transfer_kb: Number(totalTransferKb.toFixed(2)),
      
      dom_nodes: s.domNodes,
      max_dom_depth: s.maxDomDepth,
      interactive_elements: s.interactiveElements,
      
      heap_used_mb: Number(s.memoryCurrent.toFixed(2)),
      heap_total_mb: Number(s.memoryTotal.toFixed(2)),
      peak_heap_mb: Number(s.memoryPeak.toFixed(2)),
      
      request_count: s.networkRequests,
      transferred_mb: Number((s.networkTransferredBytes / (1024 * 1024)).toFixed(2)),
      ws_messages: s.wsMessages,
      ws_received_mb: Number(s.wsReceivedBytes.toFixed(2)),
      
      dashboard_mount_ms: Number(dashboardMount.toFixed(2)),
      widgets_render_ms: Number(widgetsRender.toFixed(2)),
      charts_render_ms: Number(chartsRender.toFixed(2)),
      
      widget_update_avg_ms: Number(getAvg(s.widgetRefreshTimes).toFixed(2)),
      widget_update_median_ms: Number(getPercentile(s.widgetRefreshTimes, 0.5).toFixed(2)),
      widget_update_p95_ms: Number(getPercentile(s.widgetRefreshTimes, 0.95).toFixed(2)),
      widget_update_max_ms: Number(getMax(s.widgetRefreshTimes).toFixed(2)),
      
      chart_update_avg_ms: Number(getAvg(s.chartRefreshTimes).toFixed(2)),
      chart_update_median_ms: Number(getPercentile(s.chartRefreshTimes, 0.5).toFixed(2)),
      chart_update_p95_ms: Number(getPercentile(s.chartRefreshTimes, 0.95).toFixed(2)),
      chart_update_max_ms: Number(getMax(s.chartRefreshTimes).toFixed(2)),
      
      direct_dependencies: s.directDependencies,
      total_dependencies: s.totalDependencies,
      source_files: s.sourceFiles,
      lines_of_code: s.linesOfCode,
      component_count: s.componentCount
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'antdesignbenchmark.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = metrics || metricsRef.current;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: '320px',
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      color: '#00ffcc',
      border: '1px solid #00ffcc',
      borderRadius: '8px',
      padding: '12px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 99999,
      boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', borderBottom: '1px solid #00ffcc', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ENGINEERING BENCHMARK</span>
        <button 
          onClick={handleExport}
          style={{ 
            background: '#00ffcc', 
            color: '#0f172a', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '4px 8px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '10px'
          }}
        >
          EXPORT BENCHMARK
        </button>
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
        <div><strong>Codebase:</strong> {s.linesOfCode} LOC | {s.componentCount} Components</div>
        <div><strong>Deps:</strong> {s.directDependencies} direct | {s.totalDependencies} total</div>
        <div style={{ borderTop: '1px dashed #00ffcc55', margin: '4px 0' }} />
        <div><strong>DOM Nodes:</strong> {s.domNodes} (Max Depth: {s.maxDomDepth})</div>
        <div><strong>Memory:</strong> {s.memoryCurrent.toFixed(1)} MB (Peak: {s.memoryPeak.toFixed(1)})</div>
        <div><strong>App Size:</strong> JS {(s.jsBytes / 1024).toFixed(1)} KB | CSS {(s.cssBytes / 1024).toFixed(1)} KB</div>
        <div style={{ borderTop: '1px dashed #00ffcc55', margin: '4px 0' }} />
        <div><strong>Widget Update:</strong> Avg {getAvg(s.widgetRefreshTimes).toFixed(0)}ms (P95: {getPercentile(s.widgetRefreshTimes, 0.95).toFixed(0)}ms)</div>
        <div><strong>Chart Update:</strong> Avg {getAvg(s.chartRefreshTimes).toFixed(0)}ms (P95: {getPercentile(s.chartRefreshTimes, 0.95).toFixed(0)}ms)</div>
      </div>
    </div>
  );
}
