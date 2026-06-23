import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rootDir = process.cwd();
    
    // 1. Dependency Weight
    let direct_dependencies = 0;
    let total_dependencies = 0;
    try {
      const packageJsonPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
      
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        const countDeps = (dir: string) => {
          let count = 0;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (entry.name.startsWith('@')) {
                count += countDeps(path.join(dir, entry.name));
              } else if (!entry.name.startsWith('.')) {
                count++;
              }
            }
          }
          return count;
        };
        total_dependencies = countDeps(nodeModulesPath);
      }
    } catch (e) {
      console.warn('Could not calculate dependencies', e);
    }

    // 2. Codebase Complexity
    let source_files = 0;
    let lines_of_code = 0;
    let component_count = 0;
    
    const countLoc = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          countLoc(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          source_files++;
          const content = fs.readFileSync(fullPath, 'utf-8');
          lines_of_code += content.split('\n').length;
          
          if (entry.name.endsWith('.tsx')) {
             // rough heuristic for exported components
             const matches = content.match(/export (default )?function [A-Z][a-zA-Z0-9_]*/g);
             if (matches) component_count += matches.length;
             const constMatches = content.match(/export const [A-Z][a-zA-Z0-9_]* =/g);
             if (constMatches) component_count += constMatches.length;
          }
        }
      }
    };
    
    countLoc(path.join(rootDir, 'app'));
    countLoc(path.join(rootDir, 'components'));
    countLoc(path.join(rootDir, 'utils'));
    
    return NextResponse.json({
      direct_dependencies,
      total_dependencies,
      source_files,
      lines_of_code,
      component_count
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze meta' }, { status: 500 });
  }
}
