import React, { useState, useEffect } from 'react';
import { Box, Button, SimpleGrid, Stat, StatLabel, StatNumber, Flex, Heading } from '@chakra-ui/react';

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

  // Fetch API metrics only once or periodically
  useEffect(() => {
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
      .catch(err => console.error('Failed to fetch codebase metrics', err));
  }, []);

  useEffect(() => {
    // Record mount time
    const mountEntry = performance.getEntriesByName('dashboard-mount-end')[0];
    const mountStart = performance.getEntriesByName('dashboard-mount-start')[0];
    let dashboardMount = 0;
    if (mountEntry && mountStart) {
      dashboardMount = mountEntry.startTime - mountStart.startTime;
    } else {
      // fallback
      dashboardMount = performance.now();
    }
    
    setMetrics(prev => ({ ...prev, dashboard_mount_ms: parseFloat(dashboardMount.toFixed(2)) }));

    let peakHeap = 0;

    const interval = setInterval(() => {
      // Resources
      const resources = performance.getEntriesByType('resource');
      let jsKb = 0;
      let cssKb = 0;
      let assetsKb = 0;
      let totalTransferKb = 0;
      let requestCount = resources.length;

      resources.forEach(r => {
        const sizeKb = r.transferSize ? r.transferSize / 1024 : 0;
        totalTransferKb += sizeKb;
        if (r.name.endsWith('.js') || r.name.includes('.js?')) {
          jsKb += sizeKb;
        } else if (r.name.endsWith('.css') || r.name.includes('.css?')) {
          cssKb += sizeKb;
        } else {
          assetsKb += sizeKb;
        }
      });

      // Memory
      let heapUsed = 0;
      let heapTotal = 0;
      if (performance.memory) {
        heapUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
        heapTotal = performance.memory.totalJSHeapSize / (1024 * 1024);
        if (heapUsed > peakHeap) peakHeap = heapUsed;
      }

      // DOM Metrics
      const domNodes = document.getElementsByTagName('*').length;
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;
      
      let maxDepth = 0;
      const calcDepth = (node, depth) => {
        if (depth > maxDepth) maxDepth = depth;
        for (let i = 0; i < node.children.length; i++) {
          calcDepth(node.children[i], depth + 1);
        }
      };
      calcDepth(document.body, 1);

      // Performance measures (widgets)
      const widgetMeasures = performance.getEntriesByName('widget-update');
      let widgetAvg = 0;
      let widgetMedian = 0;
      let widgetP95 = 0;
      let widgetMax = 0;
      let widgetsRender = 0;

      if (widgetMeasures.length > 0) {
        const durations = widgetMeasures.map(m => m.duration).sort((a, b) => a - b);
        const sum = durations.reduce((acc, val) => acc + val, 0);
        widgetAvg = sum / durations.length;
        widgetMax = durations[durations.length - 1];
        widgetMedian = durations[Math.floor(durations.length / 2)];
        widgetP95 = durations[Math.floor(durations.length * 0.95)];
        widgetsRender = sum; // total time spent rendering widgets in this tick
      }

      // Performance measures (charts)
      const chartMeasures = performance.getEntriesByName('chart-update');
      let chartAvg = 0;
      let chartMedian = 0;
      let chartP95 = 0;
      let chartMax = 0;
      let chartsRender = 0;

      if (chartMeasures.length > 0) {
        const durations = chartMeasures.map(m => m.duration).sort((a, b) => a - b);
        const sum = durations.reduce((acc, val) => acc + val, 0);
        chartAvg = sum / durations.length;
        chartMax = durations[durations.length - 1];
        chartMedian = durations[Math.floor(durations.length / 2)];
        chartP95 = durations[Math.floor(durations.length * 0.95)];
        chartsRender = sum;
      }

      // Limpa os buffers para não estourar o limite de 150 entries do browser e focar apenas na janela de 1 segundo
      performance.clearMeasures('widget-update');
      performance.clearMeasures('chart-update');
      performance.clearMarks('widget-update-start');
      performance.clearMarks('widget-update-end');
      performance.clearMarks('chart-update-start');
      performance.clearMarks('chart-update-end');

      // Read global WS variables from window if available
      const wsMessages = window.__WS_MESSAGES__ || 0;
      const wsReceivedMb = window.__WS_RECEIVED_MB__ || 0;

      setMetrics(prev => ({
        ...prev,
        js_bundle_kb: parseFloat(jsKb.toFixed(2)),
        css_bundle_kb: parseFloat(cssKb.toFixed(2)),
        assets_kb: parseFloat(assetsKb.toFixed(2)),
        total_transfer_kb: parseFloat(totalTransferKb.toFixed(2)),
        transferred_mb: parseFloat((totalTransferKb / 1024).toFixed(2)),
        request_count: requestCount,
        heap_used_mb: parseFloat(heapUsed.toFixed(2)),
        heap_total_mb: parseFloat(heapTotal.toFixed(2)),
        peak_heap_mb: parseFloat(peakHeap.toFixed(2)),
        dom_nodes: domNodes,
        max_dom_depth: maxDepth,
        interactive_elements: interactiveElements,
        widget_update_avg_ms: parseFloat(widgetAvg.toFixed(2)),
        widget_update_median_ms: parseFloat(widgetMedian.toFixed(2)),
        widget_update_p95_ms: parseFloat(widgetP95.toFixed(2)),
        widget_update_max_ms: parseFloat(widgetMax.toFixed(2)),
        // Soma progressiva do tempo total de renderização de widgets
        widgets_render_ms: parseFloat((prev.widgets_render_ms + widgetsRender).toFixed(2)),
        
        chart_update_avg_ms: parseFloat(chartAvg.toFixed(2)),
        chart_update_median_ms: parseFloat(chartMedian.toFixed(2)),
        chart_update_p95_ms: parseFloat(chartP95.toFixed(2)),
        chart_update_max_ms: parseFloat(chartMax.toFixed(2)),
        // Soma progressiva do tempo total de renderização de gráficos
        charts_render_ms: parseFloat((prev.charts_render_ms + chartsRender).toFixed(2)),

        ws_messages: wsMessages,
        ws_received_mb: parseFloat(wsReceivedMb.toFixed(4)),
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const exportToJSON = () => {
    const dataStr = JSON.stringify(metrics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ChakraUI-benchmark.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box 
      position="fixed" 
      bottom={0} 
      left={0} 
      right={0} 
      bg="gray.900" 
      color="white" 
      p={4} 
      boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
      zIndex={9999}
      maxH="30vh"
      overflowY="auto"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="md" color="blue.300">Benchmark Analyzer</Heading>
        <Button colorScheme="blue" size="sm" onClick={exportToJSON}>
          EXPORT BENCHMARK
        </Button>
      </Flex>
      
      <SimpleGrid columns={[2, 4, 6, 8]} spacing={4}>
        {Object.entries(metrics).map(([key, value]) => (
          <Stat key={key} size="sm">
            <StatLabel fontSize="xs" color="gray.400" textTransform="uppercase" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
              {key.replace(/_/g, ' ')}
            </StatLabel>
            <StatNumber fontSize="sm" fontWeight="bold">
              {value}
            </StatNumber>
          </Stat>
        ))}
      </SimpleGrid>
    </Box>
  );
}
