export interface BenchmarkMetrics {
  // 1. Production Bundle Size
  js_bundle_kb: number;
  css_bundle_kb: number;
  assets_kb: number;
  total_transfer_kb: number;

  // 2. DOM Complexity
  dom_nodes: number;
  max_dom_depth: number;
  interactive_elements: number;

  // 3. Memory Footprint
  heap_used_mb: number;
  heap_total_mb: number;
  peak_heap_mb: number;

  // 4. Network Cost
  request_count: number;
  transferred_mb: number;
  ws_messages: number;
  ws_received_mb: number;

  // 5. Rendering Cost
  dashboard_mount_ms: number;
  widgets_render_ms: number;
  charts_render_ms: number;

  // 6. Realtime Update Cost
  widget_update_avg_ms: number;
  widget_update_median_ms: number;
  widget_update_p95_ms: number;
  widget_update_max_ms: number;

  chart_update_avg_ms: number;
  chart_update_median_ms: number;
  chart_update_p95_ms: number;
  chart_update_max_ms: number;

  // 7. Dependency Weight
  direct_dependencies: number;
  total_dependencies: number;

  // 8. Codebase Complexity
  source_files: number;
  lines_of_code: number;
  component_count: number;

  // Internals for aggregation
  _widget_update_history: number[];
  _chart_update_history: number[];
}

export let benchmarkMetrics: BenchmarkMetrics = {
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
  component_count: 0,

  _widget_update_history: [],
  _chart_update_history: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();

function calculateStats(arr: number[]) {
  if (arr.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / sorted.length);
  const median = Math.round(sorted[Math.floor(sorted.length / 2)]);
  const p95 = Math.round(sorted[Math.floor(sorted.length * 0.95)]);
  const max = Math.round(sorted[sorted.length - 1]);
  return { avg, median, p95, max };
}

export const benchmarkStore = {
  getSnapshot: () => benchmarkMetrics,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update: (updates: Partial<BenchmarkMetrics>) => {
    benchmarkMetrics = { ...benchmarkMetrics, ...updates };
    listeners.forEach((l) => l());
  },
  reportWidgetUpdate: (duration: number) => {
    const newHistory = [...benchmarkMetrics._widget_update_history, duration];
    if (newHistory.length > 200) newHistory.shift();
    const stats = calculateStats(newHistory);
    benchmarkStore.update({
      _widget_update_history: newHistory,
      widget_update_avg_ms: stats.avg,
      widget_update_median_ms: stats.median,
      widget_update_p95_ms: stats.p95,
      widget_update_max_ms: stats.max,
    });
  },
  reportChartUpdate: (duration: number) => {
    const newHistory = [...benchmarkMetrics._chart_update_history, duration];
    if (newHistory.length > 200) newHistory.shift();
    const stats = calculateStats(newHistory);
    benchmarkStore.update({
      _chart_update_history: newHistory,
      chart_update_avg_ms: stats.avg,
      chart_update_median_ms: stats.median,
      chart_update_p95_ms: stats.p95,
      chart_update_max_ms: stats.max,
    });
  }
};
