import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

// ==========================================
// LOGICAL BRUTALISM: ABSTRAÇÕES CORE
// ==========================================

const Typography = ({ variant = 'body', children, className = '' }) => {
  const baseStyle = 
    variant === 'h1' ? 'font-code text-2xl text-lb-white mb-4 uppercase' :
    variant === 'h2' ? 'font-code text-xl text-lb-amber mb-3 uppercase' :
    variant === 'code' ? 'font-code text-lb-amber text-sm' :
    'font-struct text-lb-text text-base';
  
  return <div className={`${baseStyle} ${className}`}>{children}</div>;
};

const Card = ({ children, className = '' }) => (
  <div className={`border border-lb-surface bg-lb-void p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const bg = 
    variant === 'error' ? 'bg-lb-error' : 
    variant === 'success' ? 'bg-[#00FF00]' : 
    'bg-lb-amber';
  
  const text = variant === 'default' ? 'text-lb-void' : 'text-lb-white';
  
  return (
    <span className={`font-code text-xs px-2 py-1 uppercase ${bg} ${text} ${className}`}>
      {children}
    </span>
  );
};

const Table = ({ children }) => (
  <div className="w-full overflow-x-auto border border-lb-surface">
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

const TableHead = ({ children }) => (
  <thead className="bg-lb-surface text-lb-text font-code text-sm border-b border-lb-surface">
    <tr>{children}</tr>
  </thead>
);

const TableBody = ({ children }) => (
  <tbody className="font-code text-sm text-lb-white">
    {children}
  </tbody>
);

const TableRow = ({ children, className = '' }) => (
  <tr className={`border-b border-lb-surface ${className}`}>
    {children}
  </tr>
);

const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-2 ${className}`}>
    {children}
  </td>
);

// ==========================================
// WIDGETS & GRÁFICOS (COM INSTRUMENTAÇÃO NATIVA)
// ==========================================

const DataGrid = ({ columns, rows }) => {
  performance.mark('widget-render-start');
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    performance.mark('widget-render-end');
    try {
      if (isFirstRender.current) {
        performance.measure('widgets_render_mount', 'widget-render-start', 'widget-render-end');
        isFirstRender.current = false;
      } else {
        performance.measure('widget_update', 'widget-render-start', 'widget-render-end');
      }
    } catch(e) {}
  });

  return (
    <Table>
      <TableHead>
        {columns.map((col, idx) => (
          <th key={idx} className="px-4 py-2 font-normal uppercase">{col.headerName}</th>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col, idx) => (
              <TableCell key={idx} className={col.cellClassName ? col.cellClassName(row) : ''}>
                {col.renderCell ? col.renderCell(row) : row[col.field]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const BrutalistChart = ({ data }) => {
  performance.mark('chart-render-start');
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    performance.mark('chart-render-end');
    try {
      if (isFirstRender.current) {
        performance.measure('charts_render_mount', 'chart-render-start', 'chart-render-end');
        isFirstRender.current = false;
      } else {
        performance.measure('chart_update', 'chart-render-start', 'chart-render-end');
      }
    } catch(e) {}
  });

  // Renderiza um mini-gráfico brutalista de barras (top 20)
  const chartData = data.slice(0, 20);
  const maxPrice = Math.max(...chartData.map(d => d.price));

  return (
    <div className="mb-8">
      <Typography variant="code" className="mb-2 block">{'>'} VDOM CHART RENDERING</Typography>
      <div className="flex items-end gap-[2px] h-32 border-b border-lb-surface pt-4">
        {chartData.map(row => (
          <div key={row.id} className="flex-1 bg-lb-surface relative transition-none" style={{ height: `${(row.price / maxPrice) * 100}%` }}>
            <div className={`absolute top-0 left-0 w-full h-[2px] transition-none ${row.direction === 'up' ? 'bg-[#00FF00]' : row.direction === 'down' ? 'bg-lb-error' : 'bg-lb-void'}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// BENCHMARK ANALYZER
// ==========================================

const INITIAL_METRICS = {
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
};

window.__WS_METRICS = { count: 0, bytes: 0 };
window.__PEAK_HEAP = 0;
let dashboardMounted = false;

const BenchmarkAnalyzer = () => {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  useEffect(() => {
    fetch('/api/code-metrics')
      .then(r => r.json())
      .then(data => {
        setMetrics(m => ({ ...m, ...data }));
      })
      .catch(err => console.error("Could not fetch metrics.", err));

    const interval = setInterval(() => {
      setMetrics(prev => {
        const next = { ...prev };

        // 1. Network & Assets
        const resources = performance.getEntriesByType('resource');
        let jsBytes = 0, cssBytes = 0, otherBytes = 0, totalTransfer = 0;

        resources.forEach(res => {
          totalTransfer += res.transferSize || 0;
          if (res.name.endsWith('.js') || res.initiatorType === 'script') {
            jsBytes += res.transferSize || 0;
          } else if (res.name.endsWith('.css') || res.initiatorType === 'css') {
            cssBytes += res.transferSize || 0;
          } else {
            otherBytes += res.transferSize || 0;
          }
        });

        next.js_bundle_kb = parseFloat((jsBytes / 1024).toFixed(2));
        next.css_bundle_kb = parseFloat((cssBytes / 1024).toFixed(2));
        next.assets_kb = parseFloat((otherBytes / 1024).toFixed(2));
        next.total_transfer_kb = parseFloat((totalTransfer / 1024).toFixed(2));
        next.transferred_mb = parseFloat((totalTransfer / (1024 * 1024)).toFixed(4));
        next.request_count = resources.length;

        // 2. DOM Analysis
        next.dom_nodes = document.getElementsByTagName('*').length;
        next.interactive_elements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;

        let maxDepth = 0;
        const traverse = (node, depth) => {
          if (depth > maxDepth) maxDepth = depth;
          for (let child of node.children) {
            traverse(child, depth + 1);
          }
        };
        traverse(document.documentElement, 1);
        next.max_dom_depth = maxDepth;

        // 3. Heap Memory
        if (performance.memory) {
          const used = performance.memory.usedJSHeapSize / (1024 * 1024);
          const total = performance.memory.totalJSHeapSize / (1024 * 1024);
          if (used > window.__PEAK_HEAP) window.__PEAK_HEAP = used;

          next.heap_used_mb = parseFloat(used.toFixed(2));
          next.heap_total_mb = parseFloat(total.toFixed(2));
          next.peak_heap_mb = parseFloat(window.__PEAK_HEAP.toFixed(2));
        }

        // 4. Update Times (Widgets)
        const widgetUpdates = performance.getEntriesByName('widget_update');
        if (widgetUpdates.length > 0) {
          const durs = widgetUpdates.map(u => u.duration).sort((a, b) => a - b);
          next.widget_update_avg_ms = parseFloat((durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(2));
          next.widget_update_median_ms = parseFloat(durs[Math.floor(durs.length / 2)].toFixed(2));
          next.widget_update_p95_ms = parseFloat((durs[Math.floor(durs.length * 0.95)] || durs[durs.length - 1]).toFixed(2));
          next.widget_update_max_ms = parseFloat(durs[durs.length - 1].toFixed(2));
        }

        // 5. Update Times (Charts)
        const chartUpdates = performance.getEntriesByName('chart_update');
        if (chartUpdates.length > 0) {
          const durs = chartUpdates.map(u => u.duration).sort((a, b) => a - b);
          next.chart_update_avg_ms = parseFloat((durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(2));
          next.chart_update_median_ms = parseFloat(durs[Math.floor(durs.length / 2)].toFixed(2));
          next.chart_update_p95_ms = parseFloat((durs[Math.floor(durs.length * 0.95)] || durs[durs.length - 1]).toFixed(2));
          next.chart_update_max_ms = parseFloat(durs[durs.length - 1].toFixed(2));
        }

        // Mount time calculations
        if (!dashboardMounted) {
          const navEntry = performance.getEntriesByType('navigation')[0];
          if (navEntry) {
            next.dashboard_mount_ms = parseFloat((navEntry.domComplete || navEntry.domInteractive).toFixed(2));
          }
          const wMounts = performance.getEntriesByName('widgets_render_mount');
          if (wMounts.length > 0) next.widgets_render_ms = parseFloat(wMounts[0].duration.toFixed(2));

          const cMounts = performance.getEntriesByName('charts_render_mount');
          if (cMounts.length > 0) next.charts_render_ms = parseFloat(cMounts[0].duration.toFixed(2));
          
          if (wMounts.length > 0 && cMounts.length > 0) dashboardMounted = true;
        }

        // WS Mock Tracking
        next.ws_messages = window.__WS_METRICS.count;
        next.ws_received_mb = parseFloat((window.__WS_METRICS.bytes / (1024 * 1024)).toFixed(6));

        // Manter o buffer da performance limpo a cada 10.000 entradas para não estourar RAM do benchmark
        if (widgetUpdates.length > 10000) {
          performance.clearMeasures('widget_update');
          performance.clearMeasures('chart_update');
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const exportBenchmark = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "LogicalBrutalism-benchmark.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-lb-void border-t-2 border-lb-surface text-lb-text font-code text-xs z-50 p-4 max-h-[30vh] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="code" className="text-lb-white font-bold text-lg">BENCHMARK ANALYZER</Typography>
        <button 
          onClick={exportBenchmark}
          className="border border-lb-surface bg-lb-surface text-lb-amber px-4 py-2 hover:bg-lb-white hover:text-lb-void transition-none font-code uppercase cursor-pointer"
        >
          {'>'} Export Benchmark
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex flex-col border border-lb-surface p-2 bg-[#121212]">
            <span className="text-[10px] text-lb-text mb-1 uppercase opacity-80 truncate" title={key}>{key}</span>
            <span className="text-lb-amber font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// NEGÓCIO: DASHBOARD ORDER BOOK (100 LINHAS)
// ==========================================

const INITIAL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  id: `ORD-${(i + 1).toString().padStart(4, '0')}`,
  pair: `BTC-USD`,
  price: 65000 + (Math.random() * 2000 - 1000),
  amount: Math.random() * 5 + 0.1,
  direction: null, 
}));

export default function App() {
  const [data, setData] = useState(INITIAL_ROWS);

  useEffect(() => {    
    const interval = setInterval(() => {

      setData((prevData) => {
        const newData = [...prevData];
        
        for(let i = 0; i < newData.length; i++) {
          if (newData[i].direction) {
            newData[i] = { ...newData[i], direction: null };
          }
        }

        const mutationsCount = Math.floor(Math.random() * 11) + 10;
        const mutatedItems = [];
        
        for (let i = 0; i < mutationsCount; i++) {
          const randomIndex = Math.floor(Math.random() * newData.length);
          const item = newData[randomIndex];
          
          const change = (Math.random() - 0.5) * 100; 
          const newPrice = Math.max(0, item.price + change);
          
          const updatedItem = {
            ...item,
            price: newPrice,
            direction: change > 0 ? 'up' : 'down'
          };
          
          newData[randomIndex] = updatedItem;
          mutatedItems.push(updatedItem);
        }
        
        // Exact real payload size calculation (no mocks)
        const payloadString = JSON.stringify({ type: 'update', data: mutatedItems });
        const payloadBytes = new TextEncoder().encode(payloadString).length;
        
        window.__WS_METRICS.count += 1;
        window.__WS_METRICS.bytes += payloadBytes;
        
        return newData;
      });

    }, 50);

    return () => clearInterval(interval);
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID Ordem' },
    { field: 'pair', headerName: 'Paridade' },
    { 
      field: 'price', 
      headerName: 'Preço Cotação (USD)',
      renderCell: (row) => row.price.toFixed(2),
      cellClassName: (row) => {
        if (row.direction === 'up') return 'bg-[#00FF00] text-[#0A0A0A] font-bold';
        if (row.direction === 'down') return 'bg-lb-error text-lb-white font-bold';
        return '';
      }
    },
    { 
      field: 'amount', 
      headerName: 'Volume',
      renderCell: (row) => row.amount.toFixed(4)
    },
    {
      field: 'status',
      headerName: 'Mutação',
      renderCell: (row) => (
        <Badge variant={row.direction === 'up' ? 'success' : row.direction === 'down' ? 'error' : 'default'}>
          {row.direction === 'up' ? '▲ ALTA' : row.direction === 'down' ? '▼ BAIXA' : '— ESTÁVEL'}
        </Badge>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-lb-void p-8 pb-[40vh] selection:bg-lb-amber selection:text-lb-void">
      <Card className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6 border-b border-lb-surface pb-4">
          <div>
            <Typography variant="h1">Logical Brutalism - ORDER_BOOK_STREAM</Typography>
            <Typography variant="code">{'>'} WEBSOCKET MOCK RUNNING (TICK: 50MS)</Typography>
          </div>
          <div className="text-right">
            <Typography variant="body" className="mb-2 uppercase">STRESS TEST: VDOM RECONCILIATION</Typography>
            <Badge variant="error">UNOPTIMIZED MODE</Badge>
          </div>
        </div>

        <BrutalistChart data={data} />
        <DataGrid columns={columns} rows={data} />
      </Card>

      <BenchmarkAnalyzer />
    </div>
  );
}
