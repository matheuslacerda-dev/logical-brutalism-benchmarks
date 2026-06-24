const express = require('express');
const path = require('path');
const { getCodeMetrics } = require('./metrics-scanner');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));

// Initial State
let inventory = [
  { id: 'SKU-G01', name: 'NVIDIA RTX 4090 24GB', category: 'GPU', stock: 12, price: 1599.99 },
  { id: 'SKU-G02', name: 'AMD Radeon RX 7900 XTX', category: 'GPU', stock: 5, price: 999.99 },
  { id: 'SKU-C01', name: 'AMD Ryzen 9 7950X3D', category: 'CPU', stock: 18, price: 699.00 },
  { id: 'SKU-C02', name: 'Intel Core i9-14900K', category: 'CPU', stock: 8, price: 589.00 },
  { id: 'SKU-R01', name: '64GB Corsair Dominator DDR5', category: 'RAM', stock: 30, price: 210.00 },
  { id: 'SKU-R02', name: '32GB G.Skill Trident Z5 DDR5', category: 'RAM', stock: 45, price: 115.00 },
  { id: 'SKU-S01', name: 'Samsung 990 Pro 2TB NVMe', category: 'Storage', stock: 50, price: 169.99 },
  { id: 'SKU-S02', name: 'WD Black SN850X 4TB NVMe', category: 'Storage', stock: 15, price: 299.99 },
  { id: 'SKU-M01', name: 'ASUS ROG Crosshair X670E', category: 'Motherboard', stock: 7, price: 499.99 },
  { id: 'SKU-M02', name: 'MSI MAG Z790 Tomahawk', category: 'Motherboard', stock: 12, price: 259.99 },
  { id: 'SKU-P01', name: 'Corsair RM1000x 1000W', category: 'PSU', stock: 22, price: 189.99 },
  { id: 'SKU-X01', name: 'Lian Li O11 Dynamic EVO', category: 'Case', stock: 9, price: 149.99 },
];

let recentOrders = [];
let demandTracker = { GPU: 0, CPU: 0, RAM: 0 };

function getStatus(stock) {
  if (stock === 0) return 'Esgotado';
  if (stock <= 10) return 'Crítico';
  return 'Disponível';
}

function processOrder() {
  const itemIndex = Math.floor(Math.random() * inventory.length);
  const item = inventory[itemIndex];
  
  if (item.stock > 0) {
    const qty = Math.floor(Math.random() * Math.min(item.stock, 3)) + 1;
    item.stock -= qty;
    
    if (demandTracker[item.category] !== undefined) {
      demandTracker[item.category] += qty;
    }
    
    recentOrders.unshift({
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      itemName: item.name,
      qty: qty,
      time: new Date().toLocaleTimeString('pt-BR', { hour12: false })
    });
    
    if (recentOrders.length > 5) recentOrders.pop();
    
    return { item, qty };
  }
  return null;
}

app.get('/', (req, res) => {
  res.render('index', { 
    inventory, 
    getStatus, 
    recentOrders,
    demandTracker 
  });
});

app.get('/api/ticker', (req, res) => {
  const orderResult = processOrder();
  
  res.render('partials/ticker-response', { 
    orderResult, 
    getStatus,
    demandTracker
  });
});

app.post('/api/bulk-order', (req, res) => {
  let selected = req.body.selected || [];
  if (!Array.isArray(selected)) selected = [selected];
  
  const updatedItems = [];
  selected.forEach(id => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      item.stock += 20; // Refill 20 units
      updatedItems.push(item);
    }
  });
  
  // Return updated rows using OOB
  res.render('partials/bulk-response', { 
    updatedItems, 
    getStatus,
    demandTracker
  });
});

app.get('/api/inventory', (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  const filtered = inventory.filter(i => 
    i.name.toLowerCase().includes(search) || 
    i.category.toLowerCase().includes(search) ||
    i.id.toLowerCase().includes(search)
  );
  
  res.render('partials/table-body', { inventory: filtered, getStatus });
});

app.get('/api/benchmark-metrics', (req, res) => {
  const metrics = getCodeMetrics(__dirname);
  res.json(metrics);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
