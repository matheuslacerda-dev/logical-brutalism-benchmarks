import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getDirectoryStats(dirPath: string) {
  let fileCount = 0;
  let lineCount = 0;
  let componentCount = 0;

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const stats = getDirectoryStats(fullPath);
      fileCount += stats.fileCount;
      lineCount += stats.lineCount;
      componentCount += stats.componentCount;
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
      fileCount++;
      const content = fs.readFileSync(fullPath, 'utf-8');
      lineCount += content.split('\n').length;
      
      // Simple heuristic for component count
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        componentCount++;
      }
    }
  }

  return { fileCount, lineCount, componentCount };
}

export async function GET() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  
  let directDeps = 0;
  let totalDeps = 0;

  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
    directDeps = Object.keys(deps).length;

    // Read package-lock.json for total dependencies
    try {
      const lockJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package-lock.json'), 'utf-8'));
      if (lockJson.packages) {
        // -1 to ignore the root "" package
        totalDeps = Object.keys(lockJson.packages).length - 1;
      }
    } catch (e) {
      // Fallback
      totalDeps = directDeps * 5; // Rough estimate if no lockfile
    }
  } catch (err) {
    console.error('Failed to parse package.json', err);
  }

  const { fileCount, lineCount, componentCount } = getDirectoryStats(srcDir);

  return NextResponse.json({
    direct_dependencies: directDeps,
    total_dependencies: Math.max(totalDeps, 0),
    source_files: fileCount,
    lines_of_code: lineCount,
    component_count: componentCount,
  });
}
