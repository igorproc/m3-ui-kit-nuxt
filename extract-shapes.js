import fs from 'fs';
import path from 'path';

const shapesDir = path.join(process.cwd(), 'app', 'assets', 'icon', 'shapes');
const outputFile = path.join(process.cwd(), 'app', 'assets', 'icon', 'shapes.ts');

const files = fs.readdirSync(shapesDir).filter(f => f.endsWith('.svg'));
const shapes = {};

for (const file of files) {
  const nameMatch = file.match(/Shape=(.*)\.svg/);
  const name = nameMatch ? nameMatch[1] : file.replace('.svg', '');
  
  const content = fs.readFileSync(path.join(shapesDir, file), 'utf-8');
  
  const pathMatch = content.match(/<path[^>]*d="([^"]+)"/);
  if (pathMatch && pathMatch[1]) {
    // Generate camelCase name
    const camelName = name
      .replace(/[\s-]/g, '_')
      .replace(/^[0-9]/, (m) => '_' + m)
      .toLowerCase()
      .replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
      
    shapes[camelName] = pathMatch[1];
  }
}

let outContent = `// Auto-generated shapes file\n\n`;
outContent += `export const M3_SHAPES = {\n`;
for (const [key, value] of Object.entries(shapes)) {
  outContent += `  '${key}': '${value}',\n`;
}
outContent += `} as const;\n\n`;
outContent += `export type M3ShapeName = keyof typeof M3_SHAPES;\n`;

fs.writeFileSync(outputFile, outContent);
console.log('Generated shapes.ts');
