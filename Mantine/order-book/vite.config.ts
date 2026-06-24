import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function metricsPlugin(): Plugin {
  return {
    name: 'metrics-plugin',
    configureServer(server) {
      server.middlewares.use('/api/metrics', (_req, res) => {
        try {
          const root = process.cwd();
          
          // Ler package.json para dependências
          const pkgPath = path.join(root, 'package.json');
          let depsCount = 0;
          let devDepsCount = 0;
          
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            depsCount = pkg.dependencies ? Object.keys(pkg.dependencies).length : 0;
            devDepsCount = pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0;
          }
          
          let sourceFiles = 0;
          let linesOfCode = 0;
          let componentCount = 0;
          
          // Varrer diretório src
          const srcPath = path.join(root, 'src');
          function walk(dir: string) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const filepath = path.join(dir, file);
              const stat = fs.statSync(filepath);
              if (stat.isDirectory()) {
                walk(filepath);
              } else {
                if (file.match(/\.(tsx?|jsx?|css)$/)) {
                  sourceFiles++;
                  const content = fs.readFileSync(filepath, 'utf8');
                  linesOfCode += content.split('\n').length;
                  if (file.match(/\.(tsx|jsx)$/)) {
                    componentCount++;
                  }
                }
              }
            }
          }
          
          if (fs.existsSync(srcPath)) {
            walk(srcPath);
          }
          
          const data = {
            direct_dependencies: depsCount,
            total_dependencies: depsCount + devDepsCount,
            source_files: sourceFiles,
            lines_of_code: linesOfCode,
            component_count: componentCount
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (err: any) {
          console.error(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), metricsPlugin()],
})
