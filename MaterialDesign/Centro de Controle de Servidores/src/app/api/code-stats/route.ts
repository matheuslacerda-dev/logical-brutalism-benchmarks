import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getFileStats(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFileStats(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export async function GET() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  
  let sourceFiles = 0;
  let linesOfCode = 0;
  let componentCount = 0;

  const allFiles = getFileStats(srcDir);
  sourceFiles = allFiles.length;

  for (const filePath of allFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      linesOfCode += content.split('\n').length;
      
      // Count .tsx files as components loosely
      if (filePath.endsWith('.tsx') && !filePath.includes('layout.tsx') && !filePath.includes('page.tsx')) {
        componentCount++;
      } else if (filePath.includes('components') && filePath.endsWith('.tsx')) {
        componentCount++;
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  // To avoid double counting layout and page if they are in components (unlikely),
  // we count files inside components folder explicitly or simple .tsx files.
  // Actually, let's just count any .tsx file in 'src/components' explicitly.
  const componentsFiles = allFiles.filter(f => f.includes('/components/') || f.includes('\\components\\'));
  componentCount = componentsFiles.filter(f => f.endsWith('.tsx')).length;

  // Read package.json and package-lock.json
  let directDependencies = 0;
  let totalDependencies = 0;

  try {
    const pkgJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      const deps = pkg.dependencies ? Object.keys(pkg.dependencies).length : 0;
      const devDeps = pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0;
      directDependencies = deps + devDeps;
    }

    const pkgLockPath = path.join(rootDir, 'package-lock.json');
    if (fs.existsSync(pkgLockPath)) {
      const lock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf-8'));
      // In lockfile v3, total dependencies can be found in 'packages' except the root ""
      if (lock.packages) {
        totalDependencies = Object.keys(lock.packages).length - 1; // minus root package
      } else if (lock.dependencies) {
        totalDependencies = Object.keys(lock.dependencies).length;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  return NextResponse.json({
    direct_dependencies: directDependencies,
    total_dependencies: totalDependencies,
    source_files: sourceFiles,
    lines_of_code: linesOfCode,
    component_count: componentCount,
  });
}
