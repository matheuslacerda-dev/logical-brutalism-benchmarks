import { useState, useEffect } from 'react';
import { Button, Typography, Row, Col } from 'antd';

const { Text } = Typography;

// Helper to calculate percentiles
function calculateMetrics(durations: number[]) {
  if (!durations.length) return { avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const max = sorted[sorted.length - 1];
  return { avg, median, p95, max };
}

function getDomDepth(element: Element): number {
  let maxDepth = 0;
  for (let i = 0; i < element.children.length; i++) {
    maxDepth = Math.max(maxDepth, getDomDepth(element.children[i]));
  }
  return 1 + maxDepth;
}

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

  useEffect(() => {
    // Fetch backend metrics once (or periodically, but once is enough for static code metrics)
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(prev => ({
          ...prev,
          direct_dependencies: data.direct_dependencies || 0,
          total_dependencies: data.total_dependencies || 0,
          source_files: data.source_files || 0,
          lines_of_code: data.lines_of_code || 0,
          component_count: data.component_count || 0
        }));
      })
      .catch(err => console.error('Failed to fetch backend metrics:', err));

    let peakHeap = 0;

    const interval = setInterval(() => {
      // 1. Performance Resource Timing
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let jsKb = 0, cssKb = 0, assetsKb = 0, totalTransfer = 0;
      
      resources.forEach(res => {
        const sizeKb = (res.transferSize || 0) / 1024;
        totalTransfer += sizeKb;
        if (res.name.endsWith('.js') || res.name.endsWith('.ts') || res.name.endsWith('.tsx')) {
          jsKb += sizeKb;
        } else if (res.name.endsWith('.css')) {
          cssKb += sizeKb;
        } else {
          assetsKb += sizeKb;
        }
      });

      // 2. DOM Metrics
      const domNodes = document.querySelectorAll('*').length;
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;
      const maxDomDepth = getDomDepth(document.documentElement);

      // 3. Memory Metrics (if supported)
      let heapUsedMb = 0, heapTotalMb = 0;
      const memory = (performance as any).memory;
      if (memory) {
        heapUsedMb = memory.usedJSHeapSize / (1024 * 1024);
        heapTotalMb = memory.totalJSHeapSize / (1024 * 1024);
        if (heapUsedMb > peakHeap) peakHeap = heapUsedMb;
      }

      // 4. Custom Performance Marks
      const mountEntries = performance.getEntriesByName('dashboard_mount');
      const mountMs = mountEntries.length > 0 ? mountEntries[0].duration : 0;

      const widgetDurations: number[] = (window as any).__WIDGET_DURATIONS || [];
      const widgetStats = calculateMetrics(widgetDurations);

      const chartDurations: number[] = (window as any).__CHART_DURATIONS || [];
      const chartStats = calculateMetrics(chartDurations);

      const wsGlobal = (window as any).__WS_METRICS || { messages: 0, received_mb: 0 };

      setMetrics(prev => ({
        ...prev,
        js_bundle_kb: Number(jsKb.toFixed(2)),
        css_bundle_kb: Number(cssKb.toFixed(2)),
        assets_kb: Number(assetsKb.toFixed(2)),
        total_transfer_kb: Number(totalTransfer.toFixed(2)),
        transferred_mb: Number((totalTransfer / 1024).toFixed(2)),
        request_count: resources.length,
        dom_nodes: domNodes,
        max_dom_depth: maxDomDepth,
        interactive_elements: interactiveElements,
        heap_used_mb: Number(heapUsedMb.toFixed(2)),
        heap_total_mb: Number(heapTotalMb.toFixed(2)),
        peak_heap_mb: Number(peakHeap.toFixed(2)),
        ws_messages: wsGlobal.messages,
        ws_received_mb: Number(wsGlobal.received_mb.toFixed(4)),
        dashboard_mount_ms: Number(mountMs.toFixed(2)),
        widgets_render_ms: Number((widgetDurations.reduce((a,b)=>a+b,0)).toFixed(2)),
        charts_render_ms: Number((chartDurations.reduce((a,b)=>a+b,0)).toFixed(2)),
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
    downloadAnchorNode.setAttribute("download", "AntDesign-benchmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: '#fff',
      padding: '12px 24px',
      zIndex: 9999,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(8px)',
      maxHeight: '30vh',
      overflowY: 'auto'
    }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
        <Typography.Title level={5} style={{ color: '#fff', margin: 0 }}>
          Benchmark Analyzer: Ant Design
        </Typography.Title>
        <Button type="primary" onClick={handleExport}>EXPORT BENCHMARK</Button>
      </Row>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Text style={{ color: '#aaa' }}>DOM Nodes: </Text><Text strong style={{ color: '#fff' }}>{metrics.dom_nodes}</Text><br/>
          <Text style={{ color: '#aaa' }}>Max Depth: </Text><Text strong style={{ color: '#fff' }}>{metrics.max_dom_depth}</Text><br/>
          <Text style={{ color: '#aaa' }}>Mount Time: </Text><Text strong style={{ color: '#1890ff' }}>{metrics.dashboard_mount_ms} ms</Text>
        </Col>
        <Col span={6}>
          <Text style={{ color: '#aaa' }}>Heap Used: </Text><Text strong style={{ color: '#fff' }}>{metrics.heap_used_mb} MB</Text><br/>
          <Text style={{ color: '#aaa' }}>Heap Total: </Text><Text strong style={{ color: '#fff' }}>{metrics.heap_total_mb} MB</Text><br/>
          <Text style={{ color: '#aaa' }}>Avg Update: </Text><Text strong style={{ color: '#52c41a' }}>{metrics.widget_update_avg_ms} ms</Text>
        </Col>
        <Col span={6}>
          <Text style={{ color: '#aaa' }}>WS Messages: </Text><Text strong style={{ color: '#fff' }}>{metrics.ws_messages}</Text><br/>
          <Text style={{ color: '#aaa' }}>P95 Update: </Text><Text strong style={{ color: '#faad14' }}>{metrics.widget_update_p95_ms} ms</Text><br/>
          <Text style={{ color: '#aaa' }}>Max Update: </Text><Text strong style={{ color: '#ff4d4f' }}>{metrics.widget_update_max_ms} ms</Text>
        </Col>
        <Col span={6}>
          <Text style={{ color: '#aaa' }}>Code Lines: </Text><Text strong style={{ color: '#fff' }}>{metrics.lines_of_code}</Text><br/>
          <Text style={{ color: '#aaa' }}>Components: </Text><Text strong style={{ color: '#fff' }}>{metrics.component_count}</Text><br/>
          <Text style={{ color: '#aaa' }}>Total Deps: </Text><Text strong style={{ color: '#fff' }}>{metrics.total_dependencies}</Text>
        </Col>
      </Row>
    </div>
  );
}
