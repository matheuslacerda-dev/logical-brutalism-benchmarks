import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.match(/\.(tsx|ts|jsx|js)$/)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export async function GET() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  
  let lines_of_code = 0;
  let component_count = 0;
  let source_files = 0;

  const files = scanDirectory(srcDir);
  source_files = files.length;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    lines_of_code += content.split('\n').length;
    
    // Simple heuristic for counting React components
    const componentMatches = content.match(/function\s+[A-Z][a-zA-Z0-9]*\s*\(|const\s+[A-Z][a-zA-Z0-9]*\s*=\s*(?:memo|forwardRef)?\s*\(/g);
    if (componentMatches) {
      component_count += componentMatches.length;
    }
  }

  let direct_dependencies = 0;
  let total_dependencies = 0;

  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      direct_dependencies = Object.keys(deps).length;
    }

    const lockFilePath = path.join(rootDir, 'package-lock.json');
    if (fs.existsSync(lockFilePath)) {
      const lock = JSON.parse(fs.readFileSync(lockFilePath, 'utf-8'));
      if (lock.packages) {
        total_dependencies = Object.keys(lock.packages).length;
      }
    }
  } catch (e) {
    console.error("Failed to parse package files", e);
  }

  return NextResponse.json({
    direct_dependencies,
    total_dependencies,
    source_files,
    lines_of_code,
    component_count
  });
}
