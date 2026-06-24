import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getDirectoryMetrics(dirPath: string) {
  let sourceFiles = 0;
  let linesOfCode = 0;
  let componentCount = 0;

  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        if (fullPath.match(/\.(ts|tsx|js|jsx|css)$/)) {
          sourceFiles++;
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          linesOfCode += lines.length;
          
          // Basic heuristic for React components
          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            componentCount++;
          }
        }
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }
  return { sourceFiles, linesOfCode, componentCount };
}

function metricsPlugin() {
  return {
    name: 'metrics-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/metrics', (_req: any, res: any) => {
        try {
          const rootPath = process.cwd();
          
          // Parse package.json
          const packageJsonPath = path.join(rootPath, 'package.json');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const directDeps = Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length;

          // Parse package-lock.json
          const packageLockPath = path.join(rootPath, 'package-lock.json');
          let totalDeps = directDeps;
          if (fs.existsSync(packageLockPath)) {
            const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
            // Remove the empty key "" representing the root project
            const packages = packageLock.packages || {};
            totalDeps = Object.keys(packages).filter(k => k !== "").length;
          }

          // Walk src/ folder
          const srcPath = path.join(rootPath, 'src');
          const dirMetrics = getDirectoryMetrics(srcPath);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            direct_dependencies: directDeps,
            total_dependencies: totalDeps,
            source_files: dirMetrics.sourceFiles,
            lines_of_code: dirMetrics.linesOfCode,
            component_count: dirMetrics.componentCount
          }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), metricsPlugin()],
})
