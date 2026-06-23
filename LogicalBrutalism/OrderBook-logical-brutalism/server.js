import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function createServer() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Vite middleware must be after API routes so it doesn't intercept them

  app.get('/api/code-metrics', (req, res) => {
    let source_files = 0;
    let lines_of_code = 0;
    let component_count = 0;

    const readDirRecursively = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          readDirRecursively(filePath);
        } else {
          if (/\.(jsx?|tsx?|css)$/.test(file)) {
            source_files++;
            const content = fs.readFileSync(filePath, 'utf-8');
            lines_of_code += content.split('\n').length;
            
            // Regex for React components (Functions or Arrow functions starting with uppercase)
            const componentMatches = content.match(/(const|function|class)\s+[A-Z][a-zA-Z0-9]*\s*(=|\(|extends)/g);
            if (componentMatches) {
              component_count += componentMatches.length;
            }
          }
        }
      }
    };

    try {
      readDirRecursively(path.resolve('src'));
    } catch (e) {
      console.error(e);
    }

    let direct_dependencies = 0;
    let total_dependencies = 0;

    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
      direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;

      const pkgLock = JSON.parse(fs.readFileSync(path.resolve('package-lock.json'), 'utf-8'));
      total_dependencies = Object.keys(pkgLock.packages || {}).length;
      // remove the "" package which is the root project
      if (pkgLock.packages && pkgLock.packages[""]) {
        total_dependencies -= 1;
      }
    } catch (e) {
      console.error(e);
    }

    res.json({
      source_files,
      lines_of_code,
      component_count,
      direct_dependencies,
      total_dependencies
    });
  });

  app.use(vite.middlewares);

  app.listen(5173, () => {
    console.log('[SYS] Express Server running on http://localhost:5173');
  });
}

createServer();
