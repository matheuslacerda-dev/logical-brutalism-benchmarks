'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Affix, Card, Text, Group, Button, Stack, Divider, Portal, ScrollArea, SimpleGrid } from '@mantine/core';
import { benchmarkStore } from '@/utils/benchmarkStore';

export function PerformanceBenchmark() {
  const metrics = useSyncExternalStore(benchmarkStore.subscribe, benchmarkStore.getSnapshot, benchmarkStore.getSnapshot);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fetch static meta metrics
    fetch('/api/benchmark/meta')
      .then(res => res.json())
      .then(data => {
         if (!data.error) {
           benchmarkStore.update(data);
         }
      })
      .catch(() => {});

    // Performance Observer for Network and Assets
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          let jsSize = 0;
          let cssSize = 0;
          let assetSize = 0;
          let reqCount = 0;
          let transfer = 0;

          for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
            const size = entry.transferSize || entry.decodedBodySize || 0;
            transfer += size;
            reqCount++;
            
            if (entry.initiatorType === 'script' || entry.name.endsWith('.js')) {
              jsSize += size;
            } else if (entry.initiatorType === 'css' || entry.name.endsWith('.css')) {
              cssSize += size;
            } else {
              assetSize += size;
            }
          }
          
          if (transfer > 0) {
             const m = benchmarkStore.getSnapshot();
             benchmarkStore.update({
               js_bundle_kb: Math.round(m.js_bundle_kb + jsSize / 1024),
               css_bundle_kb: Math.round(m.css_bundle_kb + cssSize / 1024),
               assets_kb: Math.round(m.assets_kb + assetSize / 1024),
               total_transfer_kb: Math.round(m.total_transfer_kb + transfer / 1024),
               request_count: m.request_count + reqCount,
               transferred_mb: Number((m.transferred_mb + transfer / 1024 / 1024).toFixed(2))
             });
          }
        });
        resourceObserver.observe({ type: 'resource', buffered: true });
      } catch (e) {
        console.warn('PerformanceObserver not fully supported');
      }
    }

    // Polling DOM and Memory
    const interval = setInterval(() => {
      // Memory
      const memoryObj = (performance as any).memory;
      if (memoryObj) {
        const used = Math.round(memoryObj.usedJSHeapSize / 1024 / 1024);
        const total = Math.round(memoryObj.totalJSHeapSize / 1024 / 1024);
        const m = benchmarkStore.getSnapshot();
        benchmarkStore.update({
          heap_used_mb: used,
          heap_total_mb: total,
          peak_heap_mb: Math.max(m.peak_heap_mb, used)
        });
      }

      // DOM Depth
      const allElements = document.querySelectorAll('*');
      let maxDepth = 0;
      let interactives = 0;
      
      const getDepth = (el: Element) => {
        let depth = 0;
        let curr: Element | null = el;
        while (curr) {
          depth++;
          curr = curr.parentElement;
        }
        return depth;
      };

      allElements.forEach(el => {
        const d = getDepth(el);
        if (d > maxDepth) maxDepth = d;
        const tag = el.tagName.toLowerCase();
        if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || el.getAttribute('role') === 'button') {
          interactives++;
        }
      });

      benchmarkStore.update({
        dom_nodes: allElements.length,
        max_dom_depth: maxDepth,
        interactive_elements: interactives
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const exportBenchmark = () => {
    // Generate strict schema JSON
    const report = {
      "js_bundle_kb": metrics.js_bundle_kb,
      "css_bundle_kb": metrics.css_bundle_kb,
      "assets_kb": metrics.assets_kb,
      "total_transfer_kb": metrics.total_transfer_kb,
      
      "dom_nodes": metrics.dom_nodes,
      "max_dom_depth": metrics.max_dom_depth,
      "interactive_elements": metrics.interactive_elements,
      
      "heap_used_mb": metrics.heap_used_mb,
      "heap_total_mb": metrics.heap_total_mb,
      "peak_heap_mb": metrics.peak_heap_mb,
      
      "request_count": metrics.request_count,
      "transferred_mb": metrics.transferred_mb,
      "ws_messages": metrics.ws_messages,
      "ws_received_mb": metrics.ws_received_mb,
      
      "dashboard_mount_ms": metrics.dashboard_mount_ms,
      "widgets_render_ms": metrics.widgets_render_ms,
      "charts_render_ms": metrics.charts_render_ms,
      
      "widget_update_avg_ms": metrics.widget_update_avg_ms,
      "widget_update_median_ms": metrics.widget_update_median_ms,
      "widget_update_p95_ms": metrics.widget_update_p95_ms,
      "widget_update_max_ms": metrics.widget_update_max_ms,
      
      "chart_update_avg_ms": metrics.chart_update_avg_ms,
      "chart_update_median_ms": metrics.chart_update_median_ms,
      "chart_update_p95_ms": metrics.chart_update_p95_ms,
      "chart_update_max_ms": metrics.chart_update_max_ms,
      
      "direct_dependencies": metrics.direct_dependencies,
      "total_dependencies": metrics.total_dependencies,
      
      "source_files": metrics.source_files,
      "lines_of_code": metrics.lines_of_code,
      "component_count": metrics.component_count
    };

    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mantinebenchmark.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <Portal>
      <Affix position={{ bottom: 20, right: 20 }} zIndex={1000}>
        <Card shadow="xl" padding="md" radius="md" withBorder style={{ width: 340, backgroundColor: 'var(--mantine-color-body)' }}>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="sm">ENGINEERING BENCHMARK</Text>
          </Group>
          <Divider mb="sm" />
          
          <ScrollArea h={300} offsetScrollbars>
            <Stack gap="xs">
              <Text fw={600} size="xs" c="dimmed">SIZE & NETWORK</Text>
              <SimpleGrid cols={2} spacing="xs">
                <Text size="xs">JS: {metrics.js_bundle_kb}kb</Text>
                <Text size="xs">CSS: {metrics.css_bundle_kb}kb</Text>
                <Text size="xs">Assets: {metrics.assets_kb}kb</Text>
                <Text size="xs">Total: {metrics.total_transfer_kb}kb</Text>
                <Text size="xs">Reqs: {metrics.request_count}</Text>
                <Text size="xs">Data: {metrics.transferred_mb}mb</Text>
              </SimpleGrid>

              <Divider />
              <Text fw={600} size="xs" c="dimmed">DOM & MEMORY</Text>
              <SimpleGrid cols={2} spacing="xs">
                <Text size="xs">Nodes: {metrics.dom_nodes}</Text>
                <Text size="xs">Depth: {metrics.max_dom_depth}</Text>
                <Text size="xs">Interact: {metrics.interactive_elements}</Text>
                <Text size="xs">Heap: {metrics.heap_used_mb}mb / {metrics.heap_total_mb}mb</Text>
              </SimpleGrid>

              <Divider />
              <Text fw={600} size="xs" c="dimmed">UPDATE COST (p95)</Text>
              <SimpleGrid cols={2} spacing="xs">
                <Text size="xs">Widget: {metrics.widget_update_p95_ms}ms</Text>
                <Text size="xs">Chart: {metrics.chart_update_p95_ms}ms</Text>
              </SimpleGrid>

              <Divider />
              <Text fw={600} size="xs" c="dimmed">CODEBASE</Text>
              <SimpleGrid cols={2} spacing="xs">
                <Text size="xs">Files: {metrics.source_files}</Text>
                <Text size="xs">LOC: {metrics.lines_of_code}</Text>
                <Text size="xs">Deps: {metrics.total_dependencies}</Text>
                <Text size="xs">Comps: {metrics.component_count}</Text>
              </SimpleGrid>
            </Stack>
          </ScrollArea>
          
          <Button fullWidth mt="md" variant="filled" color="blue" onClick={exportBenchmark}>
            EXPORT BENCHMARK.JSON
          </Button>
        </Card>
      </Affix>
    </Portal>
  );
}
