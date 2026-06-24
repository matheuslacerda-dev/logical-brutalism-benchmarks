import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

function countLinesAndFiles(dirPath: string): { files: number; lines: number; components: number } {
  let filesCount = 0;
  let linesCount = 0;
  let componentsCount = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const stats = countLinesAndFiles(fullPath);
        filesCount += stats.files;
        linesCount += stats.lines;
        componentsCount += stats.components;
      } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        filesCount++;
        const content = fs.readFileSync(fullPath, 'utf8');
        linesCount += content.split('\n').length;
        
        // Simple heuristic for component count
        const matches = content.match(/export (default )?(function|const) [A-Z]/g);
        if (matches) {
          componentsCount += matches.length;
        }
      }
    }
  } catch (e) {
    console.error('Error reading dir:', e);
  }

  return { files: filesCount, lines: linesCount, components: componentsCount };
}

export async function GET() {
  try {
    const rootPath = process.cwd();
    const srcPath = path.join(rootPath, 'src');
    
    // 1. Codebase Complexity
    const codebaseStats = fs.existsSync(srcPath) 
      ? countLinesAndFiles(srcPath)
      : { files: 0, lines: 0, components: 0 };

    // 2. Dependency Weight
    let direct_dependencies = 0;
    let total_dependencies = 0;
    
    const pkgJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      direct_dependencies = Object.keys(deps).length;
    }
    
    const pkgLockPath = path.join(rootPath, 'package-lock.json');
    if (fs.existsSync(pkgLockPath)) {
      const lock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'));
      if (lock.packages) {
        total_dependencies = Object.keys(lock.packages).filter(k => k !== '').length;
      } else if (lock.dependencies) {
        total_dependencies = Object.keys(lock.dependencies).length;
      }
    }

    return NextResponse.json({
      direct_dependencies,
      total_dependencies,
      source_files: codebaseStats.files,
      lines_of_code: codebaseStats.lines,
      component_count: codebaseStats.components
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
