"use client";

import React, { useEffect, useState } from 'react';

interface Metrics {
  js_bundle_kb: number;
  css_bundle_kb: number;
  assets_kb: number;
  total_transfer_kb: number;
  dom_nodes: number;
  max_dom_depth: number;
  interactive_elements: number;
  heap_used_mb: number;
  heap_total_mb: number;
  peak_heap_mb: number;
  request_count: number;
  transferred_mb: number;
  ws_messages: number;
  ws_received_mb: number;
  dashboard_mount_ms: number;
  widgets_render_ms: number;
  charts_render_ms: number;
  widget_update_avg_ms: number;
  widget_update_median_ms: number;
  widget_update_p95_ms: number;
  widget_update_max_ms: number;
  chart_update_avg_ms: number;
  chart_update_median_ms: number;
  chart_update_p95_ms: number;
  chart_update_max_ms: number;
  direct_dependencies: number;
  total_dependencies: number;
  source_files: number;
  lines_of_code: number;
  component_count: number;
}

const getDomDepth = (element: Element): number => {
  if (element.children.length === 0) return 1;
  let max = 0;
  for (let i = 0; i < element.children.length; i++) {
    const depth = getDomDepth(element.children[i]);
    if (depth > max) max = depth;
  }
  return max + 1;
};

const calculatePercentiles = (arr: number[]) => {
  if (arr.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    avg: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1]
  };
};

export const BenchmarkAnalyzer: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
    dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
    heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
    request_count: 0, transferred_mb: 0, ws_messages: 0, ws_received_mb: 0,
    dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
    widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
    chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
    direct_dependencies: 0, total_dependencies: 0, source_files: 0, lines_of_code: 0, component_count: 0
  });

  const [serverMetrics, setServerMetrics] = useState<Partial<Metrics>>({});
  const [peakHeap, setPeakHeap] = useState(0);

  useEffect(() => {
    fetch('/api/metrics')
      .then(r => r.json())
      .then(data => setServerMetrics(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      let js = 0, css = 0, assets = 0, total = nav ? nav.transferSize || 0 : 0;
      
      resources.forEach(r => {
        const size = r.transferSize || 0;
        total += size;
        if (r.name.endsWith('.js') || r.initiatorType === 'script') js += size;
        else if (r.name.endsWith('.css') || r.initiatorType === 'css') css += size;
        else assets += size;
      });

      const mem = (performance as any).memory;
      let heapUsed = 0, heapTotal = 0;
      if (mem) {
        heapUsed = mem.usedJSHeapSize / 1024 / 1024;
        heapTotal = mem.totalJSHeapSize / 1024 / 1024;
        if (heapUsed > peakHeap) setPeakHeap(heapUsed);
      }

      // Widget updates measures
      const measures = performance.getEntriesByType('measure');
      const widgetUpdates = measures.filter(m => m.name.includes('Order Mutation Render')).map(m => m.duration);
      const wStats = calculatePercentiles(widgetUpdates);
      
      const chartUpdates = measures.filter(m => m.name.includes('Chart Update Render')).map(m => m.duration);
      const cStats = calculatePercentiles(chartUpdates);

      const dashMount = measures.find(m => m.name === 'Dashboard Mount')?.duration || 0;
      const widgetRender = measures.find(m => m.name === 'InventoryTable Mount')?.duration || 0;
      const chartRender = measures.find(m => m.name === 'TurnoverChart Mount')?.duration || 0;

      setMetrics(prev => ({
        ...prev,
        ...serverMetrics,
        js_bundle_kb: js / 1024,
        css_bundle_kb: css / 1024,
        assets_kb: assets / 1024,
        total_transfer_kb: total / 1024,
        transferred_mb: total / 1024 / 1024,
        request_count: resources.length + (nav ? 1 : 0),
        dom_nodes: document.querySelectorAll('*').length,
        max_dom_depth: getDomDepth(document.body),
        interactive_elements: document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
        heap_used_mb: heapUsed,
        heap_total_mb: heapTotal,
        peak_heap_mb: Math.max(peakHeap, heapUsed),
        dashboard_mount_ms: dashMount,
        widgets_render_ms: widgetRender,
        charts_render_ms: chartRender,
        widget_update_avg_ms: wStats.avg,
        widget_update_median_ms: wStats.median,
        widget_update_p95_ms: wStats.p95,
        widget_update_max_ms: wStats.max,
        chart_update_avg_ms: cStats.avg,
        chart_update_median_ms: cStats.median,
        chart_update_p95_ms: cStats.p95,
        chart_update_max_ms: cStats.max,
        // WS is harder to track without proxying native WebSocket, mock to 0 if not tracking
        ws_messages: 0,
        ws_received_mb: 0
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [serverMetrics, peakHeap]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "AntDesign-benchmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, width: 350, background: '#141414', 
      color: '#00ff00', padding: 16, borderRadius: 8, fontFamily: 'monospace',
      fontSize: 11, zIndex: 9999, maxHeight: '80vh', overflowY: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)', border: '1px solid #333'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        <strong style={{ color: '#fff', fontSize: 14 }}>BENCHMARK ANALYZER</strong>
        <button 
          onClick={handleExport}
          style={{ 
            background: '#1890ff', color: '#fff', border: 'none', 
            padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
            fontSize: 10, fontWeight: 'bold'
          }}
        >
          EXPORT BENCHMARK
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(metrics, null, 2)}
      </pre>
    </div>
  );
};
