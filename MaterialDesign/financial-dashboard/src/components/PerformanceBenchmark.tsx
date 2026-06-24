'use client';

import { useEffect, useState, useRef } from 'react';
import benchmarkStats from '../benchmark-stats.json';

type BenchmarkData = {
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
};

const initialData: BenchmarkData = {
  js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
  dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
  heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
  request_count: 0, transferred_mb: 0, ws_messages: 0, ws_received_mb: 0,
  dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
  widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
  chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
  direct_dependencies: benchmarkStats.direct_dependencies || 0,
  total_dependencies: benchmarkStats.total_dependencies || 0,
  source_files: benchmarkStats.source_files || 0,
  lines_of_code: benchmarkStats.lines_of_code || 0,
  component_count: benchmarkStats.component_count || 0
};

function getMedian(arr: number[]) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getP95(arr: number[]) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[index];
}

function getMaxDOMDepth(element: Element, currentDepth: number): number {
  let maxDepth = currentDepth;
  for (let i = 0; i < element.children.length; i++) {
    const childDepth = getMaxDOMDepth(element.children[i], currentDepth + 1);
    if (childDepth > maxDepth) maxDepth = childDepth;
  }
  return maxDepth;
}

export default function PerformanceBenchmark() {
  const [metrics, setMetrics] = useState<BenchmarkData>(initialData);
  const metricsRef = useRef<BenchmarkData>({ ...initialData });

  const updateMetric = (key: keyof BenchmarkData, value: number) => {
    metricsRef.current[key] = value;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Production Bundle Size & 4. Network Cost
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let jsBytes = 0, cssBytes = 0, assetBytes = 0;
      
      resources.forEach((r) => {
        const size = r.decodedBodySize || r.transferSize || 0;
        if (r.initiatorType === 'script') jsBytes += size;
        else if (r.initiatorType === 'css' || r.name.includes('.css')) cssBytes += size;
        else assetBytes += size;
      });
      
      const totalTransfer = jsBytes + cssBytes + assetBytes;
      updateMetric('js_bundle_kb', jsBytes / 1024);
      updateMetric('css_bundle_kb', cssBytes / 1024);
      updateMetric('assets_kb', assetBytes / 1024);
      updateMetric('total_transfer_kb', totalTransfer / 1024);
      
      updateMetric('request_count', resources.length);
      updateMetric('transferred_mb', totalTransfer / (1024 * 1024));

      // 2. DOM Complexity
      const allNodes = document.querySelectorAll('*');
      updateMetric('dom_nodes', allNodes.length);
      updateMetric('max_dom_depth', getMaxDOMDepth(document.documentElement, 1));
      updateMetric('interactive_elements', document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length);

      // 3. Memory Footprint
      const mem = (performance as any).memory;
      if (mem) {
        const usedMb = mem.usedJSHeapSize / (1024 * 1024);
        const totalMb = mem.totalJSHeapSize / (1024 * 1024);
        updateMetric('heap_used_mb', usedMb);
        updateMetric('heap_total_mb', totalMb);
        if (usedMb > metricsRef.current.peak_heap_mb) {
          updateMetric('peak_heap_mb', usedMb);
        }
      }

      // 5. Rendering Cost & 6. Realtime Update Cost
      const measures = performance.getEntriesByType('measure');
      
      let widgetUpdateTimes: number[] = [];
      let chartUpdateTimes: number[] = [];
      
      let widgetsRenderTotal = 0;
      let chartsRenderTotal = 0;

      measures.forEach(m => {
        // Mount times
        if (m.name === 'dashboard_mount_ms') updateMetric('dashboard_mount_ms', m.duration);
        if (m.name.startsWith('react-render-widgets')) widgetsRenderTotal += m.duration;
        if (m.name.startsWith('react-render-charts')) chartsRenderTotal += m.duration;
        
        // Update times
        if (m.name.startsWith('widget-update-')) widgetUpdateTimes.push(m.duration);
        if (m.name.startsWith('chart-update-')) chartUpdateTimes.push(m.duration);
      });

      if (widgetsRenderTotal > 0) updateMetric('widgets_render_ms', widgetsRenderTotal);
      if (chartsRenderTotal > 0) updateMetric('charts_render_ms', chartsRenderTotal);

      if (widgetUpdateTimes.length > 0) {
        updateMetric('widget_update_avg_ms', widgetUpdateTimes.reduce((a, b) => a + b, 0) / widgetUpdateTimes.length);
        updateMetric('widget_update_median_ms', getMedian(widgetUpdateTimes));
        updateMetric('widget_update_p95_ms', getP95(widgetUpdateTimes));
        updateMetric('widget_update_max_ms', Math.max(...widgetUpdateTimes));
      }

      if (chartUpdateTimes.length > 0) {
        updateMetric('chart_update_avg_ms', chartUpdateTimes.reduce((a, b) => a + b, 0) / chartUpdateTimes.length);
        updateMetric('chart_update_median_ms', getMedian(chartUpdateTimes));
        updateMetric('chart_update_p95_ms', getP95(chartUpdateTimes));
        updateMetric('chart_update_max_ms', Math.max(...chartUpdateTimes));
      }

      // Force UI update
      setMetrics({ ...metricsRef.current });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const exportBenchmark = () => {
    // Generate the exact schema output
    const exportData = {
      js_bundle_kb: Number(metrics.js_bundle_kb.toFixed(2)),
      css_bundle_kb: Number(metrics.css_bundle_kb.toFixed(2)),
      assets_kb: Number(metrics.assets_kb.toFixed(2)),
      total_transfer_kb: Number(metrics.total_transfer_kb.toFixed(2)),
      
      dom_nodes: metrics.dom_nodes,
      max_dom_depth: metrics.max_dom_depth,
      interactive_elements: metrics.interactive_elements,
      
      heap_used_mb: Number(metrics.heap_used_mb.toFixed(2)),
      heap_total_mb: Number(metrics.heap_total_mb.toFixed(2)),
      peak_heap_mb: Number(metrics.peak_heap_mb.toFixed(2)),
      
      request_count: metrics.request_count,
      transferred_mb: Number(metrics.transferred_mb.toFixed(2)),
      ws_messages: metrics.ws_messages,
      ws_received_mb: metrics.ws_received_mb,
      
      dashboard_mount_ms: Number(metrics.dashboard_mount_ms.toFixed(2)),
      widgets_render_ms: Number(metrics.widgets_render_ms.toFixed(2)),
      charts_render_ms: Number(metrics.charts_render_ms.toFixed(2)),
      
      widget_update_avg_ms: Number(metrics.widget_update_avg_ms.toFixed(2)),
      widget_update_median_ms: Number(metrics.widget_update_median_ms.toFixed(2)),
      widget_update_p95_ms: Number(metrics.widget_update_p95_ms.toFixed(2)),
      widget_update_max_ms: Number(metrics.widget_update_max_ms.toFixed(2)),
      
      chart_update_avg_ms: Number(metrics.chart_update_avg_ms.toFixed(2)),
      chart_update_median_ms: Number(metrics.chart_update_median_ms.toFixed(2)),
      chart_update_p95_ms: Number(metrics.chart_update_p95_ms.toFixed(2)),
      chart_update_max_ms: Number(metrics.chart_update_max_ms.toFixed(2)),
      
      direct_dependencies: metrics.direct_dependencies,
      total_dependencies: metrics.total_dependencies,
      source_files: metrics.source_files,
      lines_of_code: metrics.lines_of_code,
      component_count: metrics.component_count
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materialdesignbenchmark.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '320px',
      backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155',
      borderRadius: '8px', padding: '16px', color: '#f8fafc',
      fontFamily: 'monospace', fontSize: '11px', zIndex: 9999,
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      maxHeight: '80vh', overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
        <strong style={{ fontSize: '13px', color: '#38bdf8' }}>OBJECTIVE BENCHMARK</strong>
        <button 
          onClick={exportBenchmark}
          style={{ 
            backgroundColor: '#0ea5e9', color: '#fff', border: 'none', 
            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
          }}
        >
          EXPORT BENCHMARK
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ color: '#94a3b8' }}>App Size</div>
          <div>JS: {metrics.js_bundle_kb.toFixed(0)} KB</div>
          <div>CSS: {metrics.css_bundle_kb.toFixed(0)} KB</div>
        </div>
        <div>
          <div style={{ color: '#94a3b8' }}>DOM</div>
          <div>Nodes: {metrics.dom_nodes}</div>
          <div>Max Depth: {metrics.max_dom_depth}</div>
        </div>
        <div>
          <div style={{ color: '#94a3b8' }}>Memory</div>
          <div>Used: {metrics.heap_used_mb.toFixed(1)} MB</div>
          <div>Peak: {metrics.peak_heap_mb.toFixed(1)} MB</div>
        </div>
        <div>
          <div style={{ color: '#94a3b8' }}>Network</div>
          <div>Reqs: {metrics.request_count}</div>
          <div>Transf: {metrics.transferred_mb.toFixed(1)} MB</div>
        </div>
        <div>
          <div style={{ color: '#94a3b8' }}>Render</div>
          <div>Mount: {metrics.dashboard_mount_ms.toFixed(0)} ms</div>
          <div>Widgets: {metrics.widgets_render_ms.toFixed(0)} ms</div>
        </div>
        <div>
          <div style={{ color: '#94a3b8' }}>Codebase</div>
          <div>Files: {metrics.source_files}</div>
          <div>Dependencies: {metrics.direct_dependencies}</div>
        </div>
      </div>
    </div>
  );
}
