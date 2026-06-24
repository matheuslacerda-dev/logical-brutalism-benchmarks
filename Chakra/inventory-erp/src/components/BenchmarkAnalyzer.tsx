'use client'

import { useEffect, useState, useRef } from 'react'
import { Box, Button, HStack, Divider, Heading } from '@chakra-ui/react'
import { Download } from 'lucide-react'

interface BenchmarkMetrics {
  js_bundle_kb: number
  css_bundle_kb: number
  assets_kb: number
  total_transfer_kb: number
  dom_nodes: number
  max_dom_depth: number
  interactive_elements: number
  heap_used_mb: number
  heap_total_mb: number
  peak_heap_mb: number
  request_count: number
  transferred_mb: number
  ws_messages: number
  ws_received_mb: number
  dashboard_mount_ms: number
  widgets_render_ms: number
  charts_render_ms: number
  widget_update_avg_ms: number
  widget_update_median_ms: number
  widget_update_p95_ms: number
  widget_update_max_ms: number
  chart_update_avg_ms: number
  chart_update_median_ms: number
  chart_update_p95_ms: number
  chart_update_max_ms: number
  direct_dependencies: number
  total_dependencies: number
  source_files: number
  lines_of_code: number
  component_count: number
}

const defaultMetrics: BenchmarkMetrics = {
  js_bundle_kb: 0, css_bundle_kb: 0, assets_kb: 0, total_transfer_kb: 0,
  dom_nodes: 0, max_dom_depth: 0, interactive_elements: 0,
  heap_used_mb: 0, heap_total_mb: 0, peak_heap_mb: 0,
  request_count: 0, transferred_mb: 0, ws_messages: 0, ws_received_mb: 0,
  dashboard_mount_ms: 0, widgets_render_ms: 0, charts_render_ms: 0,
  widget_update_avg_ms: 0, widget_update_median_ms: 0, widget_update_p95_ms: 0, widget_update_max_ms: 0,
  chart_update_avg_ms: 0, chart_update_median_ms: 0, chart_update_p95_ms: 0, chart_update_max_ms: 0,
  direct_dependencies: 0, total_dependencies: 0, source_files: 0, lines_of_code: 0, component_count: 0
}

function calculateStats(entries: PerformanceEntry[]) {
  if (entries.length === 0) return { avg: 0, median: 0, p95: 0, max: 0 }
  const durations = entries.map(e => e.duration).sort((a, b) => a - b)
  const sum = durations.reduce((a, b) => a + b, 0)
  const avg = sum / durations.length
  const max = durations[durations.length - 1]
  const median = durations[Math.floor(durations.length / 2)]
  const p95Index = Math.floor(durations.length * 0.95)
  const p95 = durations[p95Index] || max
  
  return {
    avg: Number(avg.toFixed(2)),
    median: Number(median.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    max: Number(max.toFixed(2))
  }
}

function getMaxDOMDepth(element: Element): number {
  let maxDepth = 0;
  for (const child of Array.from(element.children)) {
    maxDepth = Math.max(maxDepth, getMaxDOMDepth(child) + 1);
  }
  return maxDepth;
}

export const BenchmarkAnalyzer = () => {
  const [metrics, setMetrics] = useState<BenchmarkMetrics>(defaultMetrics)
  const peakHeap = useRef(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 1. Fetch static metrics from API once
    fetch('/api/benchmark')
      .then(res => res.json())
      .then(data => {
        setMetrics(prev => ({ ...prev, ...data }))
      })
      .catch(() => {})

    // 2. Poll dynamic metrics every 1s
    const interval = setInterval(() => {
      // DOM Metrics
      const allElements = document.getElementsByTagName('*')
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      
      const dom_nodes = allElements.length
      const interactive_count = interactiveElements.length
      const max_dom_depth = getMaxDOMDepth(document.documentElement)

      // Network Metrics
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      let js_kb = 0, css_kb = 0, assets_kb = 0, total_transfer = 0
      
      resources.forEach(r => {
        const size = r.transferSize || 0
        total_transfer += size
        if (r.name.endsWith('.js')) js_kb += size
        else if (r.name.endsWith('.css')) css_kb += size
        else assets_kb += size
      })

      // Memory (Chrome only)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (performance as any).memory
      let heapUsed = 0, heapTotal = 0
      if (memory) {
        heapUsed = memory.usedJSHeapSize / (1024 * 1024)
        heapTotal = memory.totalJSHeapSize / (1024 * 1024)
        if (heapUsed > peakHeap.current) peakHeap.current = heapUsed
      }

      // Performance Marks/Measures
      const tableRenders = performance.getEntriesByName('Tabela Render')
      const dashboardMounts = performance.getEntriesByName('Dashboard Mount')
      const chartRenders = performance.getEntriesByName('Chart Render')
      const orderMutations = performance.getEntriesByName('Order Mutation')
      const chartMutations = performance.getEntriesByName('Chart Mutation')

      const orderStats = calculateStats(orderMutations)
      const chartStats = calculateStats(chartMutations)

      setMetrics(prev => ({
        ...prev,
        dom_nodes,
        max_dom_depth,
        interactive_elements: interactive_count,
        js_bundle_kb: Number((js_kb / 1024).toFixed(2)),
        css_bundle_kb: Number((css_kb / 1024).toFixed(2)),
        assets_kb: Number((assets_kb / 1024).toFixed(2)),
        total_transfer_kb: Number((total_transfer / 1024).toFixed(2)),
        request_count: resources.length,
        transferred_mb: Number((total_transfer / (1024 * 1024)).toFixed(2)),
        heap_used_mb: Number(heapUsed.toFixed(2)),
        heap_total_mb: Number(heapTotal.toFixed(2)),
        peak_heap_mb: Number(peakHeap.current.toFixed(2)),
        
        dashboard_mount_ms: dashboardMounts.length > 0 ? Number(dashboardMounts[0].duration.toFixed(2)) : 0,
        widgets_render_ms: tableRenders.length > 0 ? Number(tableRenders[0].duration.toFixed(2)) : 0,
        charts_render_ms: chartRenders.length > 0 ? Number(chartRenders[0].duration.toFixed(2)) : 0,

        widget_update_avg_ms: orderStats.avg,
        widget_update_median_ms: orderStats.median,
        widget_update_p95_ms: orderStats.p95,
        widget_update_max_ms: orderStats.max,

        chart_update_avg_ms: chartStats.avg,
        chart_update_median_ms: chartStats.median,
        chart_update_p95_ms: chartStats.p95,
        chart_update_max_ms: chartStats.max,
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const exportBenchmark = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "ChakraUI-benchmark.json")
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  if (!isOpen) {
    return (
      <Button 
        position="fixed" 
        bottom={4} 
        right={4} 
        colorScheme="purple" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        zIndex={9999}
      >
        Monitor
      </Button>
    )
  }

  return (
    <Box 
      position="fixed" 
      bottom={4} 
      right={4} 
      w="400px" 
      maxH="80vh" 
      bg="gray.900" 
      borderWidth="1px" 
      borderColor="purple.500" 
      borderRadius="md" 
      boxShadow="dark-lg"
      p={4} 
      zIndex={9999}
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { background: '#805AD5' }
      }}
    >
      <HStack justify="space-between" mb={4}>
        <Heading size="sm" color="purple.300">Benchmark Analyzer</Heading>
        <HStack>
          <Button size="xs" colorScheme="purple" leftIcon={<Download size={14} />} onClick={exportBenchmark}>
            EXPORT BENCHMARK
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setIsOpen(false)}>X</Button>
        </HStack>
      </HStack>
      
      <Divider borderColor="gray.700" mb={3} />

      <Box fontSize="xs" fontFamily="mono" color="green.200">
        <pre>{JSON.stringify(metrics, null, 2)}</pre>
      </Box>
    </Box>
  )
}
