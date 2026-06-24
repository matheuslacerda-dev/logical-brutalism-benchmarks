const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function countLinesAndFiles(dir, extensions) {
  let files = 0;
  let lines = 0;
  let components = 0;

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.includes(path.extname(entry.name))) {
        files++;
        const content = fs.readFileSync(fullPath, 'utf8');
        lines += content.split('\n').length;
        
        // Basic heuristic for exported components
        const componentMatches = content.match(/export\s+(default\s+)?function\s+[A-Z][a-zA-Z0-9_]*/g);
        const constComponentMatches = content.match(/export\s+(const|let|var)\s+[A-Z][a-zA-Z0-9_]*\s*=/g);
        if (componentMatches) components += componentMatches.length;
        if (constComponentMatches) components += constComponentMatches.length;
      }
    }
  }
  traverse(dir);
  return { files, lines, components };
}

function getDependencies() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const direct = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
  
  let total = direct;
  try {
    const output = execSync('npm ls --parseable --all', { encoding: 'utf8', stdio: 'pipe' });
    total = output.trim().split('\n').length - 1; // subtract 1 for root
  } catch (e) {
    // npm ls might fail if there are missing peer dependencies, fallback
    total = 0;
  }
  return { direct, total };
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const { files, lines, components } = countLinesAndFiles(srcDir, ['.js', '.jsx', '.ts', '.tsx']);
  const deps = getDependencies();

  const stats = {
    source_files: files,
    lines_of_code: lines,
    component_count: components,
    direct_dependencies: deps.direct,
    total_dependencies: deps.total
  };

  fs.writeFileSync(path.join(srcDir, 'benchmark-stats.json'), JSON.stringify(stats, null, 2));
  console.log('Benchmark stats generated!');
}

main();
