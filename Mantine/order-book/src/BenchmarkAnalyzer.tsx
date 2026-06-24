import { useEffect, useState, useRef } from 'react';
import { Paper, Title, Grid, Text, Button, Divider } from '@mantine/core';

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

const defaultMetrics: BenchmarkMetrics = {
  js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
  dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
  heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
  request_count: 0, transferred_mb: 0,
  ws_messages: 0, ws_received_mb: 0,
  dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
  widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
  chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
  direct_dependencies: 0, total_dependencies: 0, source_files: 0, lines_of_code: 0, component_count: 0
};

function getMaxDomDepth(element: Element, currentDepth = 1): number {
  let max = currentDepth;
  for (let i = 0; i < element.children.length; i++) {
    const depth = getMaxDomDepth(element.children[i], currentDepth + 1);
    if (depth > max) max = depth;
  }
  return max;
}

function getPercentile(sortedArr: number[], p: number) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[index];
}

export function BenchmarkAnalyzer({ wsMessages, wsDataMutatedBytes }: { wsMessages: number, wsDataMutatedBytes: number }) {
  const [metrics, setMetrics] = useState<BenchmarkMetrics>(defaultMetrics);
  const peakHeapRef = useRef(0);
  const codeStatsRef = useRef({ deps: 0, totalDeps: 0, files: 0, loc: 0, comps: 0 });

  useEffect(() => {
    // Fetch code metrics once
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          codeStatsRef.current = {
            deps: data.direct_dependencies || 0,
            totalDeps: data.total_dependencies || 0,
            files: data.source_files || 0,
            loc: data.lines_of_code || 0,
            comps: data.component_count || 0
          };
        }
      })
      .catch(console.error);
  }, []);

  const wsPropsRef = useRef({ wsMessages, wsDataMutatedBytes });
  useEffect(() => {
    wsPropsRef.current = { wsMessages, wsDataMutatedBytes };
  }, [wsMessages, wsDataMutatedBytes]);

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Network & Resources
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let jsBytes = 0, cssBytes = 0, assetsBytes = 0, totalBytes = 0;
      
      resources.forEach(r => {
        const size = r.transferSize || r.decodedBodySize || 0;
        totalBytes += size;
        if (r.name.includes('.js') || r.initiatorType === 'script') jsBytes += size;
        else if (r.name.includes('.css') || r.initiatorType === 'css') cssBytes += size;
        else assetsBytes += size;
      });

      // 2. DOM metrics
      const domNodes = document.getElementsByTagName('*').length;
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length;
      const maxDepth = getMaxDomDepth(document.body);

      // 3. Memory
      const mem = (performance as any).memory;
      let heapUsed = 0, heapTotal = 0;
      if (mem) {
        heapUsed = mem.usedJSHeapSize / (1024 * 1024);
        heapTotal = mem.totalJSHeapSize / (1024 * 1024);
        if (heapUsed > peakHeapRef.current) peakHeapRef.current = heapUsed;
      }

      // 4. Update Measures
      const updates = performance.getEntriesByName('widget-update').map(m => m.duration);
      updates.sort((a, b) => a - b);
      const updateAvg = updates.length ? updates.reduce((a, b) => a + b, 0) / updates.length : 0;
      const updateMedian = getPercentile(updates, 50);
      const updateP95 = getPercentile(updates, 95);
      const updateMax = updates.length ? updates[updates.length - 1] : 0;

      const chartUpdates = performance.getEntriesByName('chart-update').map(m => m.duration);
      chartUpdates.sort((a, b) => a - b);
      const chartAvg = chartUpdates.length ? chartUpdates.reduce((a, b) => a + b, 0) / chartUpdates.length : 0;
      const chartMedian = getPercentile(chartUpdates, 50);
      const chartP95 = getPercentile(chartUpdates, 95);
      const chartMax = chartUpdates.length ? chartUpdates[chartUpdates.length - 1] : 0;

      // Mount times
      const mounts = performance.getEntriesByName('dashboard-mount');
      const mountMs = mounts.length > 0 ? mounts[0].duration : 0;

      const chartMounts = performance.getEntriesByName('charts-render-mount');
      const chartMountMs = chartMounts.length > 0 ? chartMounts[0].duration : 0;

      setMetrics({
        js_bundle_kb: Number((jsBytes / 1024).toFixed(2)),
        css_bundle_kb: Number((cssBytes / 1024).toFixed(2)),
        assets_kb: Number((assetsBytes / 1024).toFixed(2)),
        total_transfer_kb: Number((totalBytes / 1024).toFixed(2)),
        dom_nodes: domNodes,
        max_dom_depth: maxDepth,
        interactive_elements: interactiveElements,
        heap_used_mb: Number(heapUsed.toFixed(2)),
        heap_total_mb: Number(heapTotal.toFixed(2)),
        peak_heap_mb: Number(peakHeapRef.current.toFixed(2)),
        request_count: resources.length,
        transferred_mb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        ws_messages: wsPropsRef.current.wsMessages,
        ws_received_mb: Number((wsPropsRef.current.wsDataMutatedBytes / (1024 * 1024)).toFixed(4)),
        dashboard_mount_ms: Number(mountMs.toFixed(2)),
        widgets_render_ms: Number(mountMs.toFixed(2)),
        charts_render_ms: Number(chartMountMs.toFixed(2)),
        widget_update_avg_ms: Number(updateAvg.toFixed(2)),
        widget_update_median_ms: Number(updateMedian.toFixed(2)),
        widget_update_p95_ms: Number(updateP95.toFixed(2)),
        widget_update_max_ms: Number(updateMax.toFixed(2)),
        chart_update_avg_ms: Number(chartAvg.toFixed(2)),
        chart_update_median_ms: Number(chartMedian.toFixed(2)),
        chart_update_p95_ms: Number(chartP95.toFixed(2)),
        chart_update_max_ms: Number(chartMax.toFixed(2)),
        direct_dependencies: codeStatsRef.current.deps,
        total_dependencies: codeStatsRef.current.totalDeps,
        source_files: codeStatsRef.current.files,
        lines_of_code: codeStatsRef.current.loc,
        component_count: codeStatsRef.current.comps
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const jsonStr = JSON.stringify(metrics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mantine-benchmark.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper 
      shadow="xl" 
      p="xs" 
      withBorder
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '2px solid #228be6'
      }}
    >
      <Grid align="center" justify="space-between" mb="xs">
        <Grid.Col span="auto">
          <Title order={5} c="blue">Benchmark Analyzer (Mantine)</Title>
        </Grid.Col>
        <Grid.Col span="content">
          <Button size="xs" color="blue" onClick={handleExport}>
            EXPORT BENCHMARK
          </Button>
        </Grid.Col>
      </Grid>
      
      <Divider mb="xs" />

      <Grid style={{ fontSize: '11px' }}>
        {Object.entries(metrics).map(([key, value]) => (
          <Grid.Col span={2} key={key} style={{ padding: '4px' }}>
            <Text fw={700} c="dimmed" size="xs" truncate>{key}</Text>
            <Text fw={600} size="sm">{value}</Text>
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
}
