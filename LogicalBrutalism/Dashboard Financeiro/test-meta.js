import fs from 'fs';
import path from 'path';

function getMeta() {
    const root = process.cwd();
    let direct_dependencies = 0;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        direct_dependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
    } catch(e) {}

    let total_dependencies = 0;
    try {
        const nm = path.join(root, 'node_modules');
        const traverseNM = (dir) => {
            const files = fs.readdirSync(dir, {withFileTypes: true});
            for (let f of files) {
                if (f.isDirectory() && !f.name.startsWith('.')) {
                    if (f.name.startsWith('@')) {
                        traverseNM(path.join(dir, f.name));
                    } else {
                        total_dependencies++;
                        traverseNM(path.join(dir, f.name));
                    }
                }
            }
        };
        traverseNM(nm);
    } catch(e) {}

    let source_files = 0;
    let lines_of_code = 0;
    let component_count = 0;

    const traverseSrc = (dir) => {
        const files = fs.readdirSync(dir, {withFileTypes: true});
        for (let f of files) {
            if (f.isDirectory()) {
                if (!['node_modules', '.git', '.gemini', 'static'].includes(f.name) || f.name === 'static') {
                    traverseSrc(path.join(dir, f.name));
                }
            } else if (f.isFile() && f.name.match(/\.(js|html|css)$/)) {
                source_files++;
                const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
                lines_of_code += content.split('\n').length;
                
                // Count basic components
                const xDataMatches = content.match(/x-data=/g);
                if (xDataMatches) component_count += xDataMatches.length;
                
                // endpoints returning html
                const htmlEndpointMatches = content.match(/app\.get\(.*(?:html|res\.send)/g);
                if (htmlEndpointMatches) component_count += htmlEndpointMatches.length;
            }
        }
    };
    traverseSrc(root);

    console.log(JSON.stringify({
        direct_dependencies,
        total_dependencies,
        source_files,
        lines_of_code,
        component_count
    }, null, 2));
}
getMeta();
