import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath, fileList);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

export async function GET() {
  try {
    const rootPath = process.cwd();
    
    // Ler package.json
    const packageJsonPath = path.join(rootPath, 'package.json');
    let directDependencies = 0;
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      directDependencies = deps + devDeps;
    }

    // Ler package-lock.json para total dependencies
    const packageLockPath = path.join(rootPath, 'package-lock.json');
    let totalDependencies = 0;
    if (fs.existsSync(packageLockPath)) {
      const lock = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
      totalDependencies = Object.keys(lock.packages || {}).length - 1; // -1 for root ""
    } else {
      // Fallback
      totalDependencies = directDependencies;
    }

    // Scan src/
    const srcPath = path.join(rootPath, 'src');
    const sourceFiles = scanDir(srcPath);
    
    let linesOfCode = 0;
    let componentCount = 0;

    for (const file of sourceFiles) {
      linesOfCode += countLines(file);
      if (file.endsWith('.tsx')) {
        componentCount += 1;
      }
    }

    return NextResponse.json({
      direct_dependencies: directDependencies,
      total_dependencies: Math.max(0, totalDependencies),
      source_files: sourceFiles.length,
      lines_of_code: linesOfCode,
      component_count: componentCount
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao ler arquivos do sistema' }, { status: 500 });
  }
}
