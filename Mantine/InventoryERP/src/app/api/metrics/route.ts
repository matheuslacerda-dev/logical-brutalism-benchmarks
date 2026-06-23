import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('.git')) {
        fileList = getFilesRecursively(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export async function GET() {
  const rootDir = process.cwd();
  
  let direct_dependencies = 0;
  let total_dependencies = 0;
  
  try {
    const pkgJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      direct_dependencies = Object.keys(pkgJson.dependencies || {}).length + Object.keys(pkgJson.devDependencies || {}).length;
    }
    
    const lockJsonPath = path.join(rootDir, 'package-lock.json');
    if (fs.existsSync(lockJsonPath)) {
      const lockJson = JSON.parse(fs.readFileSync(lockJsonPath, 'utf8'));
      total_dependencies = Object.keys(lockJson.packages || {}).length;
      if (total_dependencies > 0) total_dependencies -= 1; // minus root package
    }
  } catch (e) {
    console.error('Error reading package info', e);
  }

  let source_files = 0;
  let lines_of_code = 0;
  let component_count = 0;
  
  try {
    const srcDir = path.join(rootDir, 'src');
    const files = getFilesRecursively(srcDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
        source_files++;
        const content = fs.readFileSync(file, 'utf8');
        lines_of_code += content.split('\n').length;
        
        if (file.endsWith('.tsx')) {
          const matches = content.match(/export\s+(default\s+)?(function|const|class)\s+[A-Z]/g);
          if (matches) {
            component_count += matches.length;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading source files', e);
  }

  return NextResponse.json({
    direct_dependencies,
    total_dependencies,
    source_files,
    lines_of_code,
    component_count
  });
}
