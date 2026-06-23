const fs = require('fs');
const path = require('path');

function getCodeMetrics(projectRoot) {
  let metrics = {
    direct_dependencies: 0,
    total_dependencies: 0,
    source_files: 0,
    lines_of_code: 0,
    component_count: 0
  };

  try {
    // 1. Direct dependencies
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      metrics.direct_dependencies = deps + devDeps;
    }

    // 2. Total dependencies
    const lockPath = path.join(projectRoot, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      if (lock.packages) {
        metrics.total_dependencies = Object.keys(lock.packages).length - 1; // minus "" (root)
      } else if (lock.dependencies) {
        metrics.total_dependencies = Object.keys(lock.dependencies).length;
      }
    } else {
        // Fallback if no lockfile
        metrics.total_dependencies = metrics.direct_dependencies;
    }

    // 3. Components count (files in views/partials)
    const partialsPath = path.join(projectRoot, 'views', 'partials');
    if (fs.existsSync(partialsPath)) {
      const partials = fs.readdirSync(partialsPath).filter(f => f.endsWith('.ejs'));
      metrics.component_count = partials.length;
    }

    // 4. Source files and Lines of code
    const exts = ['.js', '.ejs', '.css', '.html'];
    const skipDirs = ['node_modules', '.git'];

    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!skipDirs.includes(file)) {
            scanDir(fullPath);
          }
        } else {
          const ext = path.extname(file);
          if (exts.includes(ext)) {
            metrics.source_files++;
            const content = fs.readFileSync(fullPath, 'utf8');
            metrics.lines_of_code += content.split('\n').length;
          }
        }
      }
    }

    scanDir(projectRoot);

  } catch (err) {
    console.error('Error scanning code metrics:', err);
  }

  return metrics;
}

module.exports = { getCodeMetrics };
