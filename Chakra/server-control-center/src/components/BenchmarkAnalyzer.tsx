'use client'

import { useState, useEffect, useRef } from 'react';
import { Box, Button, Text, VStack, Collapse, useDisclosure } from '@chakra-ui/react';

const DESIGN_SYSTEM = "ChakraUI";

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

function calculatePercentiles(measures: PerformanceEntry[]) {
  if (measures.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 };
  const durations = measures.map(m => m.duration).sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const median = durations[Math.floor(durations.length / 2)];
  const p95 = durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1];
  const max = durations[durations.length - 1];

  return { 
    avg: Number(avg.toFixed(2)), 
    median: Number(median.toFixed(2)), 
    p95: Number(p95.toFixed(2)), 
    max: Number(max.toFixed(2)) 
  };
}

function getMaxDOMDepth(element: Element): number {
  let maxDepth = 0;
  for (let i = 0; i < element.children.length; i++) {
    const depth = getMaxDOMDepth(element.children[i]);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth + 1;
}

export default function BenchmarkAnalyzer() {
  const { isOpen, onToggle } = useDisclosure();
  const peakHeap = useRef(0);
  const [staticMetrics, setStaticMetrics] = useState<any>(null);
  
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
    fetch('/api/code-metrics')
      .then(res => res.json())
      .then(data => setStaticMetrics(data))
      .catch(err => console.error("Failed to fetch static metrics", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let js_bytes = 0, css_bytes = 0, asset_bytes = 0, total_bytes = 0;
      let ws_msg = 0, ws_bytes = 0;
      let req_count = resources.length;

      resources.forEach(r => {
        const size = r.transferSize || 0;
        total_bytes += size;
        
        if (r.name.endsWith('.js') || r.initiatorType === 'script') js_bytes += size;
        else if (r.name.endsWith('.css') || r.initiatorType === 'css') css_bytes += size;
        else if (r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest') {
          ws_msg++;
          ws_bytes += size;
        }
        else asset_bytes += size;
      });

      const dom_nodes = document.querySelectorAll('*').length;
      const interactive_elements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length;
      const max_dom_depth = getMaxDOMDepth(document.documentElement);

      const mem = (performance as any).memory;
      let heap_used = 0, heap_total = 0;
      if (mem) {
        heap_used = mem.usedJSHeapSize / (1024 * 1024);
        heap_total = mem.totalJSHeapSize / (1024 * 1024);
        if (heap_used > peakHeap.current) peakHeap.current = heap_used;
      }

      const widgetUpdates = performance.getEntriesByName('widget-update');
      const widgetStats = calculatePercentiles(widgetUpdates);

      const chartUpdates = performance.getEntriesByName('chart-update');
      const chartStats = calculatePercentiles(chartUpdates);

      const mounts = performance.getEntriesByName('dashboard-mount');
      const dashboard_mount_ms = mounts.length > 0 ? mounts[0].duration : 0;
      
      const widgetRenders = performance.getEntriesByName('widget-initial-render');
      const widgets_render_ms = widgetRenders.length > 0 ? widgetRenders[0].duration : 0;

      const chartRenders = performance.getEntriesByName('chart-initial-render');
      const charts_render_ms = chartRenders.length > 0 ? chartRenders[0].duration : 0;

      setMetrics(prev => ({
        ...prev,
        js_bundle_kb: Number((js_bytes / 1024).toFixed(2)),
        css_bundle_kb: Number((css_bytes / 1024).toFixed(2)),
        assets_kb: Number((asset_bytes / 1024).toFixed(2)),
        total_transfer_kb: Number((total_bytes / 1024).toFixed(2)),
        transferred_mb: Number((total_bytes / (1024 * 1024)).toFixed(3)),
        dom_nodes, max_dom_depth, interactive_elements,
        heap_used_mb: Number(heap_used.toFixed(2)),
        heap_total_mb: Number(heap_total.toFixed(2)),
        peak_heap_mb: Number(peakHeap.current.toFixed(2)),
        request_count: req_count,
        ws_messages: ws_msg,
        ws_received_mb: Number((ws_bytes / (1024 * 1024)).toFixed(3)),
        dashboard_mount_ms: Number(dashboard_mount_ms.toFixed(2)),
        widgets_render_ms: Number(widgets_render_ms.toFixed(2)),
        charts_render_ms: Number(charts_render_ms.toFixed(2)),
        widget_update_avg_ms: widgetStats.avg,
        widget_update_median_ms: widgetStats.median,
        widget_update_p95_ms: widgetStats.p95,
        widget_update_max_ms: widgetStats.max,
        chart_update_avg_ms: chartStats.avg,
        chart_update_median_ms: chartStats.median,
        chart_update_p95_ms: chartStats.p95,
        chart_update_max_ms: chartStats.max,
        direct_dependencies: staticMetrics?.direct_dependencies || 0,
        total_dependencies: staticMetrics?.total_dependencies || 0,
        source_files: staticMetrics?.source_files || 0,
        lines_of_code: staticMetrics?.lines_of_code || 0,
        component_count: staticMetrics?.component_count || 0
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, [staticMetrics]);

  const exportBenchmark = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${DESIGN_SYSTEM}-benchmark.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Box position="fixed" bottom={4} right={4} zIndex={9999} w="350px">
      <Collapse in={isOpen} animateOpacity>
        <Box p={4} bg="black" border="1px solid" borderColor="gray.600" borderRadius="md" mb={2} maxH="400px" overflowY="auto">
          <Text as="pre" fontSize="xs" color="green.400" fontFamily="mono" whiteSpace="pre-wrap">
            {JSON.stringify(metrics, null, 2)}
          </Text>
        </Box>
      </Collapse>
      
      <VStack spacing={2} align="stretch">
        <Button size="sm" colorScheme="blue" onClick={onToggle}>
          {isOpen ? 'HIDE' : 'SHOW'} BENCHMARK ANALYZER
        </Button>
        <Button size="sm" colorScheme="green" onClick={exportBenchmark}>
          EXPORT BENCHMARK
        </Button>
      </VStack>
    </Box>
  );
}
