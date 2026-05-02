const fs = require('fs');
const path = require('path');

const srcDir = 'D:\\dev\\primetime\\sso\\core-web-t\\app\\components\\entity\\ui-test';
const destDir = 'd:\\dev\\primetime\\ui\\app\\pages';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.vue'));

const links = [];

for (const file of files) {
    let name = file.replace('.vue', '');
    let destName = name;
    
    // Normalize name to kebab-case
    if (name.startsWith('Ui')) {
        destName = name.substring(2).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    destName = destName + '.vue';
    
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, destName);
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to ${destName}`);
    
    const route = `/${destName.replace('.vue', '')}`;
    links.push(`        <li><NuxtLink to="${route}">${name}</NuxtLink></li>`);
}

const indexContent = `<template>
  <div style="padding: 2rem;">
    <h1>UI Kit Components</h1>
    <ul>
${links.join('\n')}
    </ul>
  </div>
</template>
`;

fs.writeFileSync(path.join(destDir, 'index.vue'), indexContent);
console.log('Created index.vue with links.');
