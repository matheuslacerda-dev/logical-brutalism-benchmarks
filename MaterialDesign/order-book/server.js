import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Helpers to count
function countDependencies() {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    const pkgStr = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgStr);
    
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    
    // Naive total dependencies count by scanning node_modules folders
    let totalDeps = 0;
    const nmPath = path.join(__dirname, 'node_modules');
    if (fs.existsSync(nmPath)) {
      const nmItems = fs.readdirSync(nmPath);
      for (const item of nmItems) {
        if (item.startsWith('.')) continue;
        if (item.startsWith('@')) {
          const subItems = fs.readdirSync(path.join(nmPath, item));
          totalDeps += subItems.length;
        } else {
          totalDeps++;
        }
      }
    }
    
    return {
      direct: deps + devDeps,
      total: totalDeps
    };
  } catch (e) {
    return { direct: 0, total: 0 };
  }
}

function analyzeSource() {
  let sourceFiles = 0;
  let linesOfCode = 0;
  let componentCount = 0;

  function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        sourceFiles++;
        const content = fs.readFileSync(fullPath, 'utf8');
        linesOfCode += content.split('\n').length;
        
        // Very basic component estimation: functions starting with Uppercase returning JSX
        // or variables starting with Uppercase assigned to arrow functions returning JSX
        const matches = content.match(/function\s+[A-Z][a-zA-Z0-9_]*\s*\(|const\s+[A-Z][a-zA-Z0-9_]*\s*=\s*\([^)]*\)\s*=>/g);
        if (matches) {
          componentCount += matches.length;
        }
      }
    }
  }

  const srcDir = path.join(__dirname, 'src');
  if (fs.existsSync(srcDir)) {
    traverse(srcDir);
  }

  return { sourceFiles, linesOfCode, componentCount };
}

app.get('/api/metrics', (req, res) => {
  const deps = countDependencies();
  const source = analyzeSource();
  
  res.json({
    direct_dependencies: deps.direct,
    total_dependencies: deps.total,
    source_files: source.sourceFiles,
    lines_of_code: source.linesOfCode,
    component_count: source.componentCount
  });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`Metrics server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    const updatesCount = Math.floor(Math.random() * 11) + 10;
    const updates = [];
    
    // We send just the diffs down the wire
    for(let i = 0; i < updatesCount; i++) {
       updates.push({
         id: Math.floor(Math.random() * 100),
         change: (Math.random() - 0.5) * 5,
         spread: Math.random()
       });
    }
    
    // Send absolute true bytes over the network
    ws.send(JSON.stringify(updates));
  }, 50);

  ws.on('close', () => clearInterval(interval));
});
