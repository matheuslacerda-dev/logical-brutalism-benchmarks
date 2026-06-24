'use client';

import { useEffect, useState, useRef } from 'react';

function getPercentile(data: number[], percentile: number) {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function getAverage(data: number[]) {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function getMedian(data: number[]) {
  return getPercentile(data, 50);
}

function getMax(data: number[]) {
  if (data.length === 0) return 0;
  return Math.max(...data);
}

function calculateMaxDOMDepth(element: Element = document.body, depth: number = 1): number {
  let maxDepth = depth;
  for (let i = 0; i < element.children.length; i++) {
    const childDepth = calculateMaxDOMDepth(element.children[i], depth + 1);
    if (childDepth > maxDepth) maxDepth = childDepth;
  }
  return maxDepth;
}

export function PerformancePanel() {
  const [metrics, setMetrics] = useState({
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
    ws_messages: 0,
    ws_received_mb: 0,
    dashboard_mount_ms: 0,
    widgets_render_ms: 0,
    charts_render_ms: 0,
    widget_update_avg_ms: 0,
    widget_update_median_ms: 0,
    widget_update_p95_ms: 0,
    widget_update_max_ms: 0,
    chart_update_avg_ms: 0,
    chart_update_median_ms: 0,
    chart_update_p95_ms: 0,
    chart_update_max_ms: 0,
    direct_dependencies: 0,
    total_dependencies: 0,
    source_files: 0,
    lines_of_code: 0,
    component_count: 0
  });

  const stateRef = useRef(metrics);
  const widgetUpdates = useRef<number[]>([]);
  const chartUpdates = useRef<number[]>([]);
  
  const updateMetric = (key: keyof typeof metrics, value: number) => {
    stateRef.current = { ...stateRef.current, [key]: value };
    setMetrics({ ...stateRef.current });
  };

  useEffect(() => {
    // 1. Initial Benchmark Stats API
    fetch('/api/benchmark-stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          updateMetric('direct_dependencies', data.direct_dependencies);
          updateMetric('total_dependencies', data.total_dependencies);
          updateMetric('source_files', data.source_files);
          updateMetric('lines_of_code', data.lines_of_code);
          updateMetric('component_count', data.component_count);
        }
      }).catch(() => {});

    // 2. Memory Footprint
    let memInterval: NodeJS.Timeout;
    if ('memory' in performance) {
      memInterval = setInterval(() => {
        const mem = (performance as any).memory;
        const usedMB = Number((mem.usedJSHeapSize / 1024 / 1024).toFixed(2));
        const totalMB = Number((mem.totalJSHeapSize / 1024 / 1024).toFixed(2));
        updateMetric('heap_used_mb', usedMB);
        updateMetric('heap_total_mb', totalMB);
        updateMetric('peak_heap_mb', Math.max(stateRef.current.peak_heap_mb, usedMB));
      }, 1000);
    }

    // 3. DOM Complexity
    const domInterval = setInterval(() => {
      updateMetric('dom_nodes', document.querySelectorAll('*').length);
      updateMetric('interactive_elements', document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length);
      updateMetric('max_dom_depth', calculateMaxDOMDepth());
    }, 2000);

    // 4. Bundle & Assets Size
    const calcSizes = () => {
      let jsBytes = 0, cssBytes = 0, assetBytes = 0;
      performance.getEntriesByType('resource').forEach((entry: any) => {
        const size = entry.transferSize || entry.decodedBodySize || 0;
        if (entry.name.endsWith('.js')) jsBytes += size;
        else if (entry.name.endsWith('.css')) cssBytes += size;
        else assetBytes += size;
      });
      const totalBytes = jsBytes + cssBytes + assetBytes;
      updateMetric('js_bundle_kb', Number((jsBytes / 1024).toFixed(2)));
      updateMetric('css_bundle_kb', Number((cssBytes / 1024).toFixed(2)));
      updateMetric('assets_kb', Number((assetBytes / 1024).toFixed(2)));
      updateMetric('total_transfer_kb', Number((totalBytes / 1024).toFixed(2)));
    };
    setTimeout(calcSizes, 3000);

    // 5. Network Cost
    let reqCount = 0;
    let transferBytes = 0;
    try {
      const resObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            reqCount++;
            transferBytes += (entry.transferSize || 0);
            updateMetric('request_count', reqCount);
            updateMetric('transferred_mb', Number((transferBytes / 1024 / 1024).toFixed(3)));
          }
        });
      });
      resObserver.observe({ type: 'resource', buffered: true });
    } catch (e) {}

    // 6. Update Cost & Rendering Cost
    try {
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntriesByType('measure').forEach((entry) => {
          if (entry.name.startsWith('widget-render')) {
            const arr = widgetUpdates.current;
            arr.push(entry.duration);
            if (arr.length <= 4) { // Assumes initial batch is 4 widgets
              updateMetric('widgets_render_ms', Number((stateRef.current.widgets_render_ms + entry.duration).toFixed(2)));
            }
            updateMetric('widget_update_avg_ms', Number(getAverage(arr).toFixed(2)));
            updateMetric('widget_update_median_ms', Number(getMedian(arr).toFixed(2)));
            updateMetric('widget_update_p95_ms', Number(getPercentile(arr, 95).toFixed(2)));
            updateMetric('widget_update_max_ms', Number(getMax(arr).toFixed(2)));
          } else if (entry.name.startsWith('chart-render')) {
            const arr = chartUpdates.current;
            arr.push(entry.duration);
            if (arr.length === 1) { // Initial chart mount
              updateMetric('charts_render_ms', Number(entry.duration.toFixed(2)));
            }
            updateMetric('chart_update_avg_ms', Number(getAverage(arr).toFixed(2)));
            updateMetric('chart_update_median_ms', Number(getMedian(arr).toFixed(2)));
            updateMetric('chart_update_p95_ms', Number(getPercentile(arr, 95).toFixed(2)));
            updateMetric('chart_update_max_ms', Number(getMax(arr).toFixed(2)));
          } else if (entry.name === 'dashboard-mount') {
             updateMetric('dashboard_mount_ms', Number(entry.duration.toFixed(2)));
          }
        });
      });
      measureObserver.observe({ type: 'measure', buffered: true });
    } catch (e) {}

    return () => {
      clearInterval(memInterval);
      clearInterval(domInterval);
    };
  }, []);

  const exportJSON = () => {
    const jsonString = JSON.stringify(metrics, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chakrabenchmark.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#00FF00',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 9999,
      width: '320px',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '1px solid #333',
      pointerEvents: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px', color: '#FFF' }}>ENGINEERING BENCHMARK</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '15px' }}>
        <div style={{ color: '#aaa' }}>JS Bundle:</div> <div>{metrics.js_bundle_kb} KB</div>
        <div style={{ color: '#aaa' }}>CSS Bundle:</div> <div>{metrics.css_bundle_kb} KB</div>
        <div style={{ color: '#aaa' }}>Assets:</div> <div>{metrics.assets_kb} KB</div>
        
        <div style={{ color: '#aaa' }}>DOM Nodes:</div> <div>{metrics.dom_nodes}</div>
        <div style={{ color: '#aaa' }}>Max Depth:</div> <div>{metrics.max_dom_depth}</div>
        <div style={{ color: '#aaa' }}>Interactives:</div> <div>{metrics.interactive_elements}</div>
        
        <div style={{ color: '#aaa' }}>Heap Used:</div> <div>{metrics.heap_used_mb} MB</div>
        <div style={{ color: '#aaa' }}>Heap Peak:</div> <div>{metrics.peak_heap_mb} MB</div>
        
        <div style={{ color: '#aaa' }}>Net Req:</div> <div>{metrics.request_count}</div>
        <div style={{ color: '#aaa' }}>Net Transf:</div> <div>{metrics.transferred_mb} MB</div>
        
        <div style={{ color: '#aaa' }}>Dash Mount:</div> <div>{metrics.dashboard_mount_ms} ms</div>
        <div style={{ color: '#aaa' }}>Wdg Render:</div> <div>{metrics.widgets_render_ms} ms</div>
        <div style={{ color: '#aaa' }}>Chart Render:</div> <div>{metrics.charts_render_ms} ms</div>
        
        <div style={{ color: '#aaa' }}>Wdg Upd Avg:</div> <div>{metrics.widget_update_avg_ms} ms</div>
        <div style={{ color: '#aaa' }}>Wdg Upd P95:</div> <div>{metrics.widget_update_p95_ms} ms</div>
        
        <div style={{ color: '#aaa' }}>Chrt Upd Avg:</div> <div>{metrics.chart_update_avg_ms} ms</div>
        <div style={{ color: '#aaa' }}>Chrt Upd P95:</div> <div>{metrics.chart_update_p95_ms} ms</div>
        
        <div style={{ color: '#aaa' }}>LOC:</div> <div>{metrics.lines_of_code}</div>
        <div style={{ color: '#aaa' }}>Deps:</div> <div>{metrics.total_dependencies}</div>
      </div>

      <button 
        onClick={exportJSON}
        style={{ width: '100%', padding: '8px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        EXPORT BENCHMARK
      </button>
    </div>
  );
}
