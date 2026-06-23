'use client';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Utility functions for percentiles and averages
const calcStats = (arr: number[]) => {
  if (!arr || arr.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const max = sorted[sorted.length - 1];
  return { avg, median, p95, max };
};

export default function BenchmarkAnalyzer() {
  const [metrics, setMetrics] = useState<any>({
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

  useEffect(() => {
    // Fetch code stats once
    fetch('/api/code-stats')
      .then(r => r.json())
      .then(stats => {
        setMetrics((prev: any) => ({ ...prev, ...stats }));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let peakHeap = 0;

    const interval = setInterval(() => {
      // 1. DOM Metrics
      const domNodes = document.getElementsByTagName('*').length;
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').length;
      
      const getMaxDomDepth = (el: Element, depth: number): number => {
        let max = depth;
        for (let i = 0; i < el.children.length; i++) {
          const childDepth = getMaxDomDepth(el.children[i], depth + 1);
          if (childDepth > max) max = childDepth;
        }
        return max;
      };
      const maxDomDepth = getMaxDomDepth(document.body, 1);

      // 2. Resource Metrics
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let jsBytes = 0, cssBytes = 0, assetBytes = 0, totalBytes = 0;
      
      resources.forEach(res => {
        const size = res.transferSize || res.decodedBodySize || 0;
        totalBytes += size;
        if (res.name.includes('.js')) jsBytes += size;
        else if (res.name.includes('.css')) cssBytes += size;
        else assetBytes += size;
      });

      // 3. Memory Metrics (Chrome specific)
      const mem = (performance as any).memory;
      const heapUsed = mem ? mem.usedJSHeapSize / 1048576 : 0;
      const heapTotal = mem ? mem.totalJSHeapSize / 1048576 : 0;
      if (heapUsed > peakHeap) peakHeap = heapUsed;

      // 4. React Metrics (Marks)
      const measures = performance.getEntriesByType('measure');
      const widgetUpdates = measures.filter(m => m.name.startsWith('widget-update-')).map(m => m.duration);
      const chartUpdates = measures.filter(m => m.name.startsWith('chart-update-')).map(m => m.duration);
      const dashboardMounts = measures.filter(m => m.name === 'dashboard-mount');

      const widgetStats = calcStats(widgetUpdates);
      const chartStats = calcStats(chartUpdates);

      setMetrics((prev: any) => ({
        ...prev,
        js_bundle_kb: Math.round(jsBytes / 1024),
        css_bundle_kb: Math.round(cssBytes / 1024),
        assets_kb: Math.round(assetBytes / 1024),
        total_transfer_kb: Math.round(totalBytes / 1024),
        dom_nodes: domNodes,
        max_dom_depth: maxDomDepth,
        interactive_elements: interactiveElements,
        heap_used_mb: Number(heapUsed.toFixed(2)),
        heap_total_mb: Number(heapTotal.toFixed(2)),
        peak_heap_mb: Number(peakHeap.toFixed(2)),
        request_count: resources.length,
        transferred_mb: Number((totalBytes / 1048576).toFixed(2)),
        ws_messages: 0, // Mocked as we don't use real WS here
        ws_received_mb: 0, // Mocked
        dashboard_mount_ms: dashboardMounts.length ? Number(dashboardMounts[0].duration.toFixed(2)) : 0,
        widgets_render_ms: Number((widgetStats.avg * 8).toFixed(2)), // Approx sum of 8 widgets
        charts_render_ms: Number(chartStats.avg.toFixed(2)),
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
    downloadAnchorNode.setAttribute("download", "MaterialDesign-benchmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card 
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        width: 320, 
        maxHeight: '400px', 
        overflowY: 'auto',
        backgroundColor: 'rgba(10, 10, 10, 0.95)', 
        border: '1px solid #333',
        zIndex: 9999,
        p: 2,
        boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#00e676' }}>
          BENCHMARK ANALYZER
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleExport}
          sx={{ borderColor: '#2979ff', color: '#2979ff', fontSize: '10px', py: 0 }}
        >
          EXPORT BENCHMARK
        </Button>
      </Box>

      <Box sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#a0a0a0' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </Box>
    </Card>
  );
}
