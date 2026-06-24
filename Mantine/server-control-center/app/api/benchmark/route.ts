import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (e) {
    return 0;
  }
}

function traverseDirectory(dir: string, extensions: string[]): { files: number, loc: number, components: number } {
  let files = 0;
  let loc = 0;
  let components = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const stats = traverseDirectory(fullPath, extensions);
        files += stats.files;
        loc += stats.loc;
        components += stats.components;
      } else {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files += 1;
          loc += countLines(fullPath);
          if (ext === '.tsx') {
            components += 1;
          }
        }
      }
    }
  } catch (e) {
    // Directory might not exist
  }

  return { files, loc, components };
}

export async function GET() {
  const rootDir = process.cwd();

  // Parse package.json
  let direct_dependencies = 0;
  try {
    const pkgStr = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgStr);
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    direct_dependencies = deps + devDeps;
  } catch (e) {
    // Ignore
  }

  // Count total dependencies in node_modules
  let total_dependencies = 0;
  try {
    const nmPath = path.join(rootDir, 'node_modules');
    const entries = fs.readdirSync(nmPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('@')) {
          // Scope directory, count its children
          const scopedPath = path.join(nmPath, entry.name);
          const scopedEntries = fs.readdirSync(scopedPath, { withFileTypes: true });
          total_dependencies += scopedEntries.filter(e => e.isDirectory()).length;
        } else if (!entry.name.startsWith('.')) {
          total_dependencies += 1;
        }
      }
    }
  } catch (e) {
    // Ignore
  }

  // Scan source code
  const dirsToScan = ['app', 'components', 'utils'];
  let source_files = 0;
  let lines_of_code = 0;
  let component_count = 0;

  for (const dir of dirsToScan) {
    const stats = traverseDirectory(path.join(rootDir, dir), ['.ts', '.tsx', '.css']);
    source_files += stats.files;
    lines_of_code += stats.loc;
    component_count += stats.components;
  }

  return NextResponse.json({
    direct_dependencies,
    total_dependencies,
    source_files,
    lines_of_code,
    component_count
  });
}
