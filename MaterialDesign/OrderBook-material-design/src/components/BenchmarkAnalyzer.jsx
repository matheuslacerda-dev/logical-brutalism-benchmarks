import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Button, Divider } from '@mui/material';

// Helpers para extração de performance
const getDOMDepth = (element) => {
  if (element.children.length === 0) return 1;
  let max = 0;
  for (let i = 0; i < element.children.length; i++) {
    max = Math.max(max, getDOMDepth(element.children[i]));
  }
  return max + 1;
};

const getInteractiveElements = () => {
  return document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').length;
};

const getPercentile = (arr, q) => {
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

const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const getMax = (arr) => arr.length ? Math.max(...arr) : 0;

export default function BenchmarkAnalyzer() {
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

  const [backendMetrics, setBackendMetrics] = useState(null);

  useEffect(() => {
    // Busca métricas estáticas do backend Node.js (filesystem)
    fetch('http://localhost:3001/api/metrics')
      .then(res => res.json())
      .then(data => setBackendMetrics(data))
      .catch(err => console.error('Error fetching backend metrics:', err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Network & Resources via Performance API
      const resources = performance.getEntriesByType('resource');
      let jsBytes = 0;
      let cssBytes = 0;
      let assetBytes = 0;
      let totalBytes = 0;

      resources.forEach((r) => {
        const transferSize = r.transferSize || 0;
        totalBytes += transferSize;
        if (r.name.endsWith('.js') || r.initiatorType === 'script') {
          jsBytes += transferSize;
        } else if (r.name.endsWith('.css') || r.initiatorType === 'css') {
          cssBytes += transferSize;
        } else {
          assetBytes += transferSize;
        }
      });

      // DOM Metrics
      const domNodes = document.getElementsByTagName('*').length;
      const maxDomDepth = getDOMDepth(document.body);
      const interactiveElements = getInteractiveElements();

      // Memory Heap (apenas Chromium-based suporta de forma não-standard)
      const memory = performance.memory || {};
      const heapUsed = memory.usedJSHeapSize ? memory.usedJSHeapSize / (1024 * 1024) : 0;
      const heapTotal = memory.totalJSHeapSize ? memory.totalJSHeapSize / (1024 * 1024) : 0;

      // Extract React Performance Marks
      const updateMeasures = performance.getEntriesByName('widget_update');
      const updateDurations = updateMeasures.map(m => m.duration);
      
      const chartMeasures = performance.getEntriesByName('chart_update');
      const chartDurations = chartMeasures.map(m => m.duration);
      
      const mountMeasure = performance.getEntriesByName('dashboard_mount')[0];
      
      // Lendo os WS simulados que foram armazenados na window pelo App.jsx
      const wsCount = window.__SIMULATED_WS_MESSAGES || 0;
      const wsReceivedMb = window.__SIMULATED_WS_BYTES ? window.__SIMULATED_WS_BYTES / (1024 * 1024) : 0;

      setMetrics((prev) => {
        const peakHeap = Math.max(prev.peak_heap_mb, heapUsed);
        
        return {
          ...prev,
          js_bundle_kb: Number((jsBytes / 1024).toFixed(2)),
          css_bundle_kb: Number((cssBytes / 1024).toFixed(2)),
          assets_kb: Number((assetBytes / 1024).toFixed(2)),
          total_transfer_kb: Number((totalBytes / 1024).toFixed(2)),
          dom_nodes: domNodes,
          max_dom_depth: maxDomDepth,
          interactive_elements: interactiveElements,
          heap_used_mb: Number(heapUsed.toFixed(2)),
          heap_total_mb: Number(heapTotal.toFixed(2)),
          peak_heap_mb: Number(peakHeap.toFixed(2)),
          request_count: resources.length,
          transferred_mb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
          ws_messages: wsCount,
          ws_received_mb: Number(wsReceivedMb.toFixed(4)),
          dashboard_mount_ms: mountMeasure ? Number(mountMeasure.duration.toFixed(2)) : 0,
          widgets_render_ms: mountMeasure ? Number(mountMeasure.duration.toFixed(2)) : 0, 
          charts_render_ms: mountMeasure ? Number(mountMeasure.duration.toFixed(2)) : 0,
          widget_update_avg_ms: Number(getAvg(updateDurations).toFixed(2)),
          widget_update_median_ms: Number(getPercentile(updateDurations, 0.5).toFixed(2)),
          widget_update_p95_ms: Number(getPercentile(updateDurations, 0.95).toFixed(2)),
          widget_update_max_ms: Number(getMax(updateDurations).toFixed(2)),
          chart_update_avg_ms: Number(getAvg(chartDurations).toFixed(2)),
          chart_update_median_ms: Number(getPercentile(chartDurations, 0.5).toFixed(2)),
          chart_update_p95_ms: Number(getPercentile(chartDurations, 0.95).toFixed(2)),
          chart_update_max_ms: Number(getMax(chartDurations).toFixed(2)),
          direct_dependencies: backendMetrics?.direct_dependencies || 0,
          total_dependencies: backendMetrics?.total_dependencies || 0,
          source_files: backendMetrics?.source_files || 0,
          lines_of_code: backendMetrics?.lines_of_code || 0,
          component_count: backendMetrics?.component_count || 0
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [backendMetrics]);

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
      elevation={6}
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        width: 320,
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 9999,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
          Benchmark Analyzer
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {Object.entries(metrics).map(([key, value]) => (
            <React.Fragment key={key}>
              <Box color="text.secondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={key}>
                {key}:
              </Box>
              <Box color="success.main" textAlign="right">
                {value}
              </Box>
            </React.Fragment>
          ))}
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          size="small"
          sx={{ mt: 2, fontSize: '0.75rem', fontWeight: 'bold' }}
          onClick={handleExport}
        >
          EXPORT BENCHMARK
        </Button>
      </CardContent>
    </Card>
  );
}
