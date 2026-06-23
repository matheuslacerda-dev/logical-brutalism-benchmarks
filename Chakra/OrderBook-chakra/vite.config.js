import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const benchmarkApi = () => ({
  name: 'benchmark-api',
  configureServer(server) {
    server.middlewares.use('/api/metrics', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      
      try {
        const rootDir = process.cwd();
        const srcDir = path.join(rootDir, 'src');
        
        let direct_dependencies = 0;
        const pkgJsonPath = path.join(rootDir, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
        }

        let total_dependencies = 0;
        const nodeModulesPath = path.join(rootDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          const dirs = fs.readdirSync(nodeModulesPath);
          total_dependencies = dirs.filter(d => !d.startsWith('.')).length;
        }

        let source_files = 0;
        let lines_of_code = 0;
        let component_count = 0;

        const scanDir = (dir) => {
          if (!fs.existsSync(dir)) return;
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scanDir(fullPath);
            } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
              source_files++;
              const content = fs.readFileSync(fullPath, 'utf8');
              lines_of_code += content.split('\n').length;
              if (file.endsWith('x')) {
                const matches = content.match(/export (default )?(function|const|let|var|class) [A-Z]/g);
                if (matches) component_count += matches.length;
              }
            }
          }
        };

        scanDir(srcDir);

        res.end(JSON.stringify({
          direct_dependencies,
          total_dependencies,
          source_files,
          lines_of_code,
          component_count
        }));
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), benchmarkApi()],
})
