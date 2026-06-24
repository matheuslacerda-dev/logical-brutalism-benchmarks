import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function getSourceStats(dirPath: string): { files: number; lines: number; components: number } {
  let filesCount = 0;
  let linesCount = 0;
  let componentsCount = 0;

  if (!fs.existsSync(dirPath)) return { files: 0, lines: 0, components: 0 };

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const stats = getSourceStats(fullPath);
      filesCount += stats.files;
      linesCount += stats.lines;
      componentsCount += stats.components;
    } else {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext)) {
        filesCount++;
        linesCount += countLines(fullPath);
      }
      if (['.tsx', '.jsx'].includes(ext)) {
        componentsCount++;
      }
    }
  }

  return { files: filesCount, lines: linesCount, components: componentsCount };
}

export async function GET() {
  const rootPath = process.cwd();
  
  // Dependencies
  let direct_dependencies = 0;
  let total_dependencies = 0;
  
  try {
    const pkgJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
      direct_dependencies = Object.keys(deps).length;
    }

    const pkgLockPath = path.join(rootPath, 'package-lock.json');
    if (fs.existsSync(pkgLockPath)) {
      const pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf-8'));
      total_dependencies = pkgLock.packages ? Object.keys(pkgLock.packages).length - 1 : 0; 
      // -1 because '' is the root project
    }
  } catch (e) {
    console.error("Error reading dependencies", e);
  }

  // Source Stats
  const srcPath = path.join(rootPath, 'src');
  const stats = getSourceStats(srcPath);

  return NextResponse.json({
    direct_dependencies,
    total_dependencies,
    source_files: stats.files,
    lines_of_code: stats.lines,
    component_count: stats.components
  });
}
