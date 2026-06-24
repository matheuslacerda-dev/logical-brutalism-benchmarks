'use client';

import React, { useEffect, useState } from 'react';
import { Paper, Title, Text, Group, Stack, Button, ScrollArea, Box } from '@mantine/core';

interface BenchmarkMetrics {
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

const getPercentiles = (durations: number[]) => {
  if (durations.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    avg: sum / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1],
  };
};

export default function BenchmarkAnalyzer() {
  const [metrics, setMetrics] = useState<BenchmarkMetrics>({
    js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
    dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
    heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
    request_count: 0, transferred_mb: 0, ws_messages: 0, ws_received_mb: 0,
    dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
    widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
    chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
    direct_dependencies: 0, total_dependencies: 0, source_files: 0, lines_of_code: 0, component_count: 0
  });

  useEffect(() => {
    // Fetch static source metrics from API
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(m => ({ ...m, ...data }));
      })
      .catch(err => console.error("Failed to fetch static metrics", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window === 'undefined') return;

      // DOM Metrics
      const dom_nodes = document.getElementsByTagName('*').length;
      const interactive_elements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;
      
      let max_dom_depth = 0;
      const walk = (node: Element, depth: number) => {
        if (depth > max_dom_depth) max_dom_depth = depth;
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], depth + 1);
        }
      };
      walk(document.body, 1);

      // Memory
      let heap_used_mb = 0, heap_total_mb = 0, peak_heap_mb = 0;
      const mem = (performance as any).memory;
      if (mem) {
        heap_used_mb = mem.usedJSHeapSize / (1024 * 1024);
        heap_total_mb = mem.totalJSHeapSize / (1024 * 1024);
        peak_heap_mb = mem.jsHeapSizeLimit / (1024 * 1024); // Approximation of peak/limit
      }

      // Network / Resources
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let js_bytes = 0, css_bytes = 0, assets_bytes = 0, total_transfer = 0;
      
      resources.forEach(r => {
        const size = r.transferSize || r.decodedBodySize || 0;
        total_transfer += size;
        if (r.name.endsWith('.js') || r.initiatorType === 'script') js_bytes += size;
        else if (r.name.endsWith('.css') || r.initiatorType === 'css') css_bytes += size;
        else assets_bytes += size;
      });

      // Timings
      const getMeasureDuration = (name: string) => {
        const entries = performance.getEntriesByName(name, 'measure');
        return entries.length > 0 ? entries[entries.length - 1].duration : 0;
      };

      const getMeasureList = (name: string) => {
        return performance.getEntriesByName(name, 'measure').map(e => e.duration);
      };

      const widgetStats = getPercentiles(getMeasureList('widget_update'));
      const chartStats = getPercentiles(getMeasureList('chart_update'));

      setMetrics(prev => ({
        ...prev,
        js_bundle_kb: Number((js_bytes / 1024).toFixed(2)),
        css_bundle_kb: Number((css_bytes / 1024).toFixed(2)),
        assets_kb: Number((assets_bytes / 1024).toFixed(2)),
        total_transfer_kb: Number((total_transfer / 1024).toFixed(2)),
        transferred_mb: Number((total_transfer / (1024 * 1024)).toFixed(2)),
        request_count: resources.length,
        dom_nodes,
        max_dom_depth,
        interactive_elements,
        heap_used_mb: Number(heap_used_mb.toFixed(2)),
        heap_total_mb: Number(heap_total_mb.toFixed(2)),
        peak_heap_mb: Number(peak_heap_mb.toFixed(2)),
        dashboard_mount_ms: Number(getMeasureDuration('dashboard_mount').toFixed(2)),
        widgets_render_ms: Number(getMeasureDuration('widgets_render').toFixed(2)),
        charts_render_ms: Number(getMeasureDuration('charts_render').toFixed(2)),
        widget_update_avg_ms: Number(widgetStats.avg.toFixed(2)),
        widget_update_median_ms: Number(widgetStats.median.toFixed(2)),
        widget_update_p95_ms: Number(widgetStats.p95.toFixed(2)),
        widget_update_max_ms: Number(widgetStats.max.toFixed(2)),
        chart_update_avg_ms: Number(chartStats.avg.toFixed(2)),
        chart_update_median_ms: Number(chartStats.median.toFixed(2)),
        chart_update_p95_ms: Number(chartStats.p95.toFixed(2)),
        chart_update_max_ms: Number(chartStats.max.toFixed(2)),
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Mantine-benchmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Paper 
      shadow="xl" 
      p="xs" 
      withBorder 
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        zIndex: 1000,
        backgroundColor: 'rgba(26, 27, 30, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Group justify="space-between" mb="xs">
        <Title order={6} c="blue.4">Benchmark Analyzer</Title>
        <Button size="compact-xs" color="blue" onClick={handleExport}>
          EXPORT BENCHMARK
        </Button>
      </Group>
      
      <ScrollArea h={250} type="always" offsetScrollbars>
        <Stack gap={4}>
          {Object.entries(metrics).map(([key, value]) => (
            <Group key={key} justify="space-between" wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{key}:</Text>
              <Text size="xs" fw={700} c="green.4" style={{ fontFamily: 'monospace' }}>{value}</Text>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
