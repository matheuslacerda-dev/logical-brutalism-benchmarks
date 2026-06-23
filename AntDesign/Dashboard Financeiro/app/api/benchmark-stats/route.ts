import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}

export async function GET() {
  const cwd = process.cwd();
  
  let directDependencies = 0;
  let totalDependencies = 0;
  
  try {
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.dependencies) {
        directDependencies = Object.keys(pkg.dependencies).length;
      }
    }
    
    const lockPath = path.join(cwd, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      if (lock.packages) {
        totalDependencies = Math.max(0, Object.keys(lock.packages).length - 1);
      } else if (lock.dependencies) {
        totalDependencies = Object.keys(lock.dependencies).length;
      }
    }
  } catch (e) {
    console.error("Error calculating dependency weight:", e);
  }

  let sourceFiles = 0;
  let linesOfCode = 0;
  let componentCount = 0;

  const dirsToScan = ['app', 'components'];
  
  dirsToScan.forEach(d => {
    const fullPath = path.join(cwd, d);
    walkDir(fullPath, (filePath) => {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        sourceFiles++;
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          linesOfCode += content.split('\n').length;
          
          if (filePath.endsWith('.tsx')) {
            componentCount++; 
          }
        } catch (e) {}
      }
    });
  });

  return NextResponse.json({
    directDependencies,
    totalDependencies,
    sourceFiles,
    linesOfCode,
    componentCount
  });
}
