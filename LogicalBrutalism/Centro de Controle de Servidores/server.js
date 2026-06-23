const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use('/static', express.static(path.join(__dirname, 'static')));

// Data simulation
const servers = [
  { id: 'aws-east', name: 'AWS-East', pid: 1024, status: 'ONLINE', cpu: [], ram: [] },
  { id: 'dublin-core', name: 'Dublin-Core', pid: 2048, status: 'ONLINE', cpu: [], ram: [] },
  { id: 'cork-edge', name: 'Cork-Edge', pid: 3072, status: 'IDLE', cpu: [], ram: [] },
  { id: 'tokyo-main', name: 'Tokyo-Main', pid: 4096, status: 'ONLINE', cpu: [], ram: [] },
  { id: 'sp-node', name: 'SP-Node', pid: 5120, status: 'OVERLOAD', cpu: [], ram: [] },
  { id: 'fra-backup', name: 'FRA-Backup', pid: 6144, status: 'IDLE', cpu: [], ram: [] },
  { id: 'ny-proxy', name: 'NY-Proxy', pid: 7168, status: 'ONLINE', cpu: [], ram: [] },
  { id: 'lon-gateway', name: 'LON-Gateway', pid: 8192, status: 'ONLINE', cpu: [], ram: [] }
];

// Initialize history
servers.forEach(s => {
  for (let i = 0; i < 20; i++) {
    s.cpu.push(Math.floor(Math.random() * 100));
    s.ram.push(Math.floor(Math.random() * 100));
  }
});

const logs = [];
const logMessages = [
  "SYS_WARN: High memory allocation on ",
  "DB_INFO: Connection pool reset success on ",
  "SEC_ALERT: Failed SSH login attempt on ",
  "NET_INFO: Latency spike detected on ",
  "SYS_INFO: Garbage collection triggered on ",
];

function generateLog() {
  const server = servers[Math.floor(Math.random() * servers.length)];
  const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  logs.push(`[${ts}] ${msg}${server.name}`);
  if (logs.length > 20) logs.shift();
}

for(let i=0; i<20; i++) generateLog();

function updateServers() {
  servers.forEach(s => {
    // shift
    s.cpu.shift();
    s.ram.shift();
    // new val based on status
    let cpuBase = s.status === 'OVERLOAD' ? 80 : s.status === 'IDLE' ? 10 : 40;
    let ramBase = s.status === 'OVERLOAD' ? 85 : s.status === 'IDLE' ? 20 : 50;
    s.cpu.push(Math.max(0, Math.min(100, cpuBase + (Math.random() * 40 - 20))));
    s.ram.push(Math.max(0, Math.min(100, ramBase + (Math.random() * 30 - 15))));

    // random status change
    if (Math.random() < 0.1) {
      const r = Math.random();
      s.status = r < 0.6 ? 'ONLINE' : r < 0.8 ? 'OVERLOAD' : 'IDLE';
    }
  });
}

setInterval(updateServers, 3000);
setInterval(generateLog, 2000);

// SVG generation helpers
function createSparkline(data, colorClass) {
  const width = 100;
  const height = 30;
  const max = 100;
  const min = 0;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" class="w-full h-8 stroke-current ${colorClass}" fill="none" stroke-width="2"><polyline points="${pts}"></polyline></svg>`;
}

function createAreaChart(data, colorClass) {
  const width = 400;
  const height = 200;
  const max = 100;
  const min = 0;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / (max - min)) * height;
    return `${x},${y}`;
  });
  const pathData = `M 0,${height} L ${pts.join(' L ')} L ${width},${height} Z`;
  return `<svg viewBox="0 0 ${width} ${height}" class="w-full h-48 fill-current ${colorClass} opacity-50"><path d="${pathData}"></path></svg>`;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/servers', (req, res) => {
  let html = '';
  servers.forEach(s => {
    const statusColor = s.status === 'ONLINE' ? 'text-lb-white border-lb-surface' : s.status === 'OVERLOAD' ? 'text-lb-error border-lb-error' : 'text-lb-amber border-lb-amber';
    const cpuSpark = createSparkline(s.cpu, 'text-lb-text');
    const ramSpark = createSparkline(s.ram, 'text-lb-amber');
    
    html += `
      <div class="border p-4 bg-lb-void cursor-pointer hover:bg-lb-surface transition-colors ${statusColor}"
           hx-get="/api/details/${s.id}" 
           hx-target="#detail-panel" 
           hx-trigger="click">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-code font-bold text-sm uppercase">${s.name}</h3>
          <span class="text-xs">[PID:${s.pid}]</span>
        </div>
        <div class="text-xs font-struct mb-4">STATUS: ${s.status}</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs mb-1">CPU ${Math.floor(s.cpu[s.cpu.length-1])}%</div>
            ${cpuSpark}
          </div>
          <div>
            <div class="text-xs mb-1">RAM ${Math.floor(s.ram[s.ram.length-1])}%</div>
            ${ramSpark}
          </div>
        </div>
      </div>
    `;
  });
  res.send(html);
});

app.get('/api/logs', (req, res) => {
  let html = logs.map(l => {
    let color = 'text-lb-text';
    if(l.includes('WARN')) color = 'text-lb-amber';
    if(l.includes('ALERT') || l.includes('FAIL')) color = 'text-lb-error';
    return `<div class="font-code text-xs mb-1 ${color}">${l}</div>`;
  }).join('');
  res.send(html);
});

app.get('/api/details/:id', (req, res) => {
  const s = servers.find(sv => sv.id === req.params.id);
  if (!s) return res.send('<div>Server not found</div>');
  
  const chart = createAreaChart(s.cpu, 'text-lb-white');
  const ramChart = createAreaChart(s.ram, 'text-lb-amber');

  const html = `
    <div class="border border-lb-surface p-6 bg-lb-void">
      <h2 class="font-code text-lg uppercase mb-2 border-b border-lb-surface pb-2">Detalhes: ${s.name}</h2>
      <div class="text-sm font-struct mb-4">PID: ${s.pid} | STATUS: <span class="${s.status==='OVERLOAD'?'text-lb-error':'text-lb-text'}">${s.status}</span></div>
      
      <div class="mb-6 relative group" x-data="{ showTooltip: false, mouseX: 0, val: 0 }" @mousemove="showTooltip=true; mouseX = $event.clientX; val = Math.floor(($event.offsetX / $el.clientWidth) * 100)" @mouseleave="showTooltip=false">
        <h3 class="text-xs font-code mb-2 uppercase">CPU Histórico (24h)</h3>
        ${chart}
        <div x-show="showTooltip" class="absolute top-0 bg-lb-text text-lb-void text-xs p-1" x-bind:style="'left: ' + mouseX + 'px'">
          <span x-text="val"></span>% CPU
        </div>
      </div>
      
      <div class="relative group" x-data="{ showTooltip: false, mouseX: 0, val: 0 }" @mousemove="showTooltip=true; mouseX = $event.clientX; val = Math.floor(($event.offsetX / $el.clientWidth) * 100)" @mouseleave="showTooltip=false">
        <h3 class="text-xs font-code mb-2 uppercase">RAM Histórico (24h)</h3>
        ${ramChart}
        <div x-show="showTooltip" class="absolute top-0 bg-lb-text text-lb-void text-xs p-1" x-bind:style="'left: ' + mouseX + 'px'">
          <span x-text="val"></span>% RAM
        </div>
      </div>
    </div>
  `;
  res.send(html);
});

app.get('/api/code-metrics', (req, res) => {
  let direct_dependencies = 0;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
  } catch(e) {}

  let total_dependencies = 0;
  try {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      total_dependencies = fs.readdirSync(nodeModulesPath).filter(d => !d.startsWith('.')).length;
    }
  } catch(e) {}

  let source_files = 0;
  let lines_of_code = 0;
  let component_count = 0; 

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file.startsWith('.')) continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.json')) {
        source_files++;
        const content = fs.readFileSync(fullPath, 'utf8');
        lines_of_code += content.split('\n').length;
        if (file.endsWith('.html')) {
          component_count += (content.match(/hx-get/g) || []).length + 1; 
        } else if (file === 'server.js') {
          component_count += (content.match(/app\.get/g) || []).length;
        }
      }
    }
  }
  
  try { scanDir(__dirname); } catch(e) {}

  res.json({
    direct_dependencies,
    total_dependencies,
    source_files,
    lines_of_code,
    component_count
  });
});

app.listen(PORT, () => {
  console.log(`Logical Brutalism Dashboard running at http://localhost:${PORT}`);
});
