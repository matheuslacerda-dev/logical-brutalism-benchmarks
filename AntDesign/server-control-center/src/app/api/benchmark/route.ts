import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function scanDirectory(dir: string) {
  let sourceFiles = 0;
  let linesOfCode = 0;
  let componentCount = 0;

  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subStats = scanDirectory(fullPath);
        sourceFiles += subStats.sourceFiles;
        linesOfCode += subStats.linesOfCode;
        componentCount += subStats.componentCount;
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext)) {
          sourceFiles++;
          linesOfCode += countLines(fullPath);
          
          if (ext === '.tsx' || ext === '.jsx') {
            componentCount++;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error scanning directory', e);
  }

  return { sourceFiles, linesOfCode, componentCount };
}

export async function GET() {
  const rootDir = process.cwd();
  
  let directDependencies = 0;
  let totalDependencies = 0;

  try {
    const pkgPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      directDependencies += Object.keys(pkg.dependencies || {}).length;
      directDependencies += Object.keys(pkg.devDependencies || {}).length;
    }

    const lockPath = path.join(rootDir, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      if (lock.packages) {
        // -1 to ignore the root "" package
        totalDependencies = Math.max(0, Object.keys(lock.packages).length - 1);
      } else if (lock.dependencies) {
        totalDependencies = Object.keys(lock.dependencies).length;
      }
    }
  } catch (e) {
    console.error('Error reading package info', e);
  }

  const srcDir = path.join(rootDir, 'src');
  const codeStats = scanDirectory(srcDir);

  return NextResponse.json({
    direct_dependencies: directDependencies,
    total_dependencies: totalDependencies,
    source_files: codeStats.sourceFiles,
    lines_of_code: codeStats.linesOfCode,
    component_count: codeStats.componentCount,
  });
}
