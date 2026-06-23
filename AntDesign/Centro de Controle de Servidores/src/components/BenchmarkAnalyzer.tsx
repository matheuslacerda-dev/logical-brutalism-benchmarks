'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { DownloadOutlined, BarChartOutlined } from '@ant-design/icons';

const { Text } = Typography;

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

const getDomDepth = (element: Element): number => {
  let maxDepth = 0;
  for (let i = 0; i < element.children.length; i++) {
    const depth = getDomDepth(element.children[i]);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth + 1;
};

const calculatePercentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(2));
};

export const BenchmarkAnalyzer: React.FC = () => {
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const peakHeapRef = useRef(0);
  const widgetUpdatesRef = useRef<number[]>([]);

  // Fetch static code metrics once
  useEffect(() => {
    fetch('/api/benchmark')
      .then(r => r.json())
      .then(data => {
        setMetrics(prev => ({
          ...((prev || {}) as BenchmarkMetrics),
          direct_dependencies: data.direct_dependencies || 0,
          total_dependencies: data.total_dependencies || 0,
          source_files: data.source_files || 0,
          lines_of_code: data.lines_of_code || 0,
          component_count: data.component_count || 0,
        }));
      })
      .catch(e => console.error("Error fetching static benchmark", e));
  }, []);

  // Interval for real-time browser metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        if (!prev) return prev;

        // 1. Network & Bundle Sizes
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        let jsBytes = 0;
        let cssBytes = 0;
        let assetBytes = 0;
        let totalBytes = 0;

        resources.forEach(r => {
          const size = r.transferSize || r.decodedBodySize || 0;
          totalBytes += size;
          if (r.name.endsWith('.js') || r.initiatorType === 'script') jsBytes += size;
          else if (r.name.endsWith('.css') || r.initiatorType === 'css') cssBytes += size;
          else if (['img', 'font'].includes(r.initiatorType)) assetBytes += size;
        });

        // 2. DOM Metrics
        const domNodes = document.querySelectorAll('*').length;
        const maxDomDepth = getDomDepth(document.documentElement);
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;

        // 3. Memory (Heap)
        let heapUsed = 0;
        let heapTotal = 0;
        // @ts-ignore
        if (performance.memory) {
          // @ts-ignore
          heapUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
          // @ts-ignore
          heapTotal = performance.memory.totalJSHeapSize / (1024 * 1024);
          if (heapUsed > peakHeapRef.current) peakHeapRef.current = heapUsed;
        }

        // 4. React Measures
        const measures = performance.getEntriesByType('measure');
        
        let dashboardMountMs = 0;
        
        measures.forEach(m => {
          if (m.name.startsWith('Render Card')) {
            widgetUpdatesRef.current.push(m.duration);
          }
          if (m.name === 'FetchMetrics') {
            // We use fetch time + render time approximation for widget updates if we want,
            // but we'll stick to 'Render Card' duration.
          }
        });

        const recentWidgetUpdates = widgetUpdatesRef.current;
        if (recentWidgetUpdates.length > 100) {
          recentWidgetUpdates.splice(0, recentWidgetUpdates.length - 100);
        }

        const widgetAvg = recentWidgetUpdates.length > 0 
          ? recentWidgetUpdates.reduce((a, b) => a + b, 0) / recentWidgetUpdates.length 
          : 0;
        const widgetMax = recentWidgetUpdates.length > 0 ? Math.max(...recentWidgetUpdates) : 0;
        const widgetMedian = calculatePercentile(recentWidgetUpdates, 50);
        const widgetP95 = calculatePercentile(recentWidgetUpdates, 95);

        // Clear marks and measures after processing
        performance.clearMeasures();
        performance.clearMarks();

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
          peak_heap_mb: Number(peakHeapRef.current.toFixed(2)),
          request_count: resources.length,
          transferred_mb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
          ws_messages: 0, // Mock API, no actual WS
          ws_received_mb: 0,
          dashboard_mount_ms: dashboardMountMs,
          widgets_render_ms: widgetMax, // Approx
          charts_render_ms: 0, // Recharts SVG mounts inline with widget
          widget_update_avg_ms: Number(widgetAvg.toFixed(2)),
          widget_update_median_ms: widgetMedian,
          widget_update_p95_ms: widgetP95,
          widget_update_max_ms: Number(widgetMax.toFixed(2)),
          chart_update_avg_ms: Number(widgetAvg.toFixed(2)), // Chart is inside widget
          chart_update_median_ms: widgetMedian,
          chart_update_p95_ms: widgetP95,
          chart_update_max_ms: Number(widgetMax.toFixed(2)),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const exportBenchmark = () => {
    if (!metrics) return;
    const jsonStr = JSON.stringify(metrics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AntDesign-benchmark.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!metrics) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        transition: 'all 0.3s ease',
      }}
    >
      {!isOpen ? (
        <Button 
          type="primary" 
          icon={<BarChartOutlined />} 
          size="large" 
          onClick={() => setIsOpen(true)}
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
        >
          Benchmark
        </Button>
      ) : (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '14px' }}>Benchmark Analyzer</span>
              <Button type="text" size="small" style={{ color: '#8c8c8c' }} onClick={() => setIsOpen(false)}>✕</Button>
            </div>
          }
          style={{ width: 400, backgroundColor: 'rgba(20, 20, 20, 0.95)', border: '1px solid #303030', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}
          headStyle={{ borderBottom: '1px solid #303030', minHeight: '40px' }}
          bodyStyle={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}
        >
          <pre style={{ 
            fontSize: '11px', 
            color: '#a6adc8', 
            margin: 0, 
            fontFamily: 'monospace',
            backgroundColor: 'transparent' 
          }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={exportBenchmark}
              style={{ width: '100%' }}
            >
              EXPORT BENCHMARK
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
