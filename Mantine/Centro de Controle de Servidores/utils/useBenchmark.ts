import { useState, useEffect, useRef } from 'react';

export interface BenchmarkMetrics {
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

const initialMetrics: BenchmarkMetrics = {
  js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
  dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
  heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
  request_count: 0, transferred_mb: 0, ws_messages: 0, ws_received_mb: 0,
  dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
  widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
  chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
  direct_dependencies: 0, total_dependencies: 0, source_files: 0, lines_of_code: 0, component_count: 0
};

function calculateStats(arr: number[]) {
  if (arr.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { avg, median, p95, max };
}

function getMaxDepth(element: Element): number {
  let max = 0;
  for (let i = 0; i < element.children.length; i++) {
    const depth = getMaxDepth(element.children[i]);
    if (depth > max) max = depth;
  }
  return max + 1;
}

export function useBenchmark() {
  const [metrics, setMetrics] = useState<BenchmarkMetrics>(initialMetrics);
  const peakHeap = useRef(0);
  const staticFetched = useRef(false);

  // We keep historical array of measure durations
  const widgetDurations = useRef<number[]>([]);
  const chartDurations = useRef<number[]>([]);

  useEffect(() => {
    // 1. Fetch static metrics once
    if (!staticFetched.current) {
      staticFetched.current = true;
      fetch('/api/benchmark')
        .then(res => res.json())
        .then(data => {
          setMetrics(prev => ({ ...prev, ...data }));
        })
        .catch(() => {});
    }

    // 2. Poll every 1s
    const interval = setInterval(() => {
      // Analyze performance resource entries
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let js_bytes = 0, css_bytes = 0, other_bytes = 0;
      
      resources.forEach(res => {
        const size = res.transferSize || res.decodedBodySize || 0;
        if (res.name.endsWith('.js')) js_bytes += size;
        else if (res.name.endsWith('.css')) css_bytes += size;
        else other_bytes += size;
      });

      const js_bundle_kb = Math.round(js_bytes / 1024);
      const css_bundle_kb = Math.round(css_bytes / 1024);
      const assets_kb = Math.round(other_bytes / 1024);
      const total_transfer_kb = js_bundle_kb + css_bundle_kb + assets_kb;

      // DOM Metrics
      const dom_nodes = document.querySelectorAll('*').length;
      const max_dom_depth = getMaxDepth(document.body);
      const interactive_elements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length;

      // Heap (Chromium only)
      let heap_used_mb = 0, heap_total_mb = 0;
      const perf = performance as any;
      if (perf.memory) {
        heap_used_mb = Number((perf.memory.usedJSHeapSize / 1048576).toFixed(2));
        heap_total_mb = Number((perf.memory.totalJSHeapSize / 1048576).toFixed(2));
        if (heap_used_mb > peakHeap.current) peakHeap.current = heap_used_mb;
      }

      // Execution Times from marks
      const measures = performance.getEntriesByType('measure');
      const latestWidgetMeasures = measures.filter(m => m.name === 'Metrics Update');
      const latestChartMeasures = measures.filter(m => m.name === 'Log Update');

      // Add new ones to historical (we clear marks after reading if possible to avoid duplicates, but performance.getEntries keeps growing.
      // So let's just recalculate from all available or map them)
      const wDurs = latestWidgetMeasures.map(m => m.duration);
      const cDurs = latestChartMeasures.map(m => m.duration);
      
      const wStats = calculateStats(wDurs);
      const cStats = calculateStats(cDurs);

      // Mount metrics (if we measured them)
      const dashboardMount = measures.find(m => m.name === 'Dashboard Mount')?.duration || 0;

      setMetrics(prev => ({
        ...prev,
        js_bundle_kb,
        css_bundle_kb,
        assets_kb,
        total_transfer_kb,
        dom_nodes,
        max_dom_depth,
        interactive_elements,
        heap_used_mb,
        heap_total_mb,
        peak_heap_mb: peakHeap.current,
        request_count: resources.length,
        transferred_mb: Number((total_transfer_kb / 1024).toFixed(2)),
        // WS is mocked as 0 unless we really use it
        ws_messages: 0,
        ws_received_mb: 0,
        dashboard_mount_ms: Number(dashboardMount.toFixed(2)),
        widgets_render_ms: Number((wDurs[wDurs.length - 1] || 0).toFixed(2)),
        charts_render_ms: Number((cDurs[cDurs.length - 1] || 0).toFixed(2)),
        widget_update_avg_ms: Number(wStats.avg.toFixed(2)),
        widget_update_median_ms: Number(wStats.median.toFixed(2)),
        widget_update_p95_ms: Number(wStats.p95.toFixed(2)),
        widget_update_max_ms: Number(wStats.max.toFixed(2)),
        chart_update_avg_ms: Number(cStats.avg.toFixed(2)),
        chart_update_median_ms: Number(cStats.median.toFixed(2)),
        chart_update_p95_ms: Number(cStats.p95.toFixed(2)),
        chart_update_max_ms: Number(cStats.max.toFixed(2)),
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
