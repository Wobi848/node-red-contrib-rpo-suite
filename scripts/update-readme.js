#!/usr/bin/env node
// Regenerates the root README.md package table from current folder versions.
// Preserves the existing folder order.

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const readmePath = path.join(base, 'README.md');

const existing = fs.readFileSync(readmePath, 'utf8');
const rowRe = /^\|\s*([^|\s][^|]*?)\s*\|\s*(node-red-contrib-[^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm;
const orderedFolders = [];
let m;
while ((m = rowRe.exec(existing)) !== null) {
  if (m[1] === 'Folder') continue;
  orderedFolders.push(m[1]);
}

// Append any new folders not yet in the table
const dirs = fs.readdirSync(base).filter(d => {
  try {
    return fs.statSync(path.join(base, d)).isDirectory()
      && fs.existsSync(path.join(base, d, 'package.json'))
      && d !== 'rpo-suite'
      && d !== 'node_modules';
  } catch (e) { return false; }
});
for (const d of dirs) {
  if (!orderedFolders.includes(d)) orderedFolders.push(d);
}

const rows = orderedFolders.map(folder => {
  try {
    const p = JSON.parse(fs.readFileSync(path.join(base, folder, 'package.json'), 'utf8'));
    return `| ${folder} | ${p.name} | ${p.version} |`;
  } catch (e) {
    return `| ${folder} | (missing) | - |`;
  }
});

const newReadme = `# node-red-contrib-rpo — Monorepo

Building automation and industrial control nodes for Node-RED by **sr.rpo**.

All packages are available individually on npm or as a single install via [node-red-contrib-rpo-suite](rpo-suite/).

## Install Everything

\`\`\`bash
npm install node-red-contrib-rpo-suite
\`\`\`

## Packages

| Folder | Package | Version |
|--------|---------|---------|
${rows.join('\n')}

## License

MIT — sr.rpo | wobi848
`;

fs.writeFileSync(readmePath, newReadme);
console.log('README.md updated with ' + rows.length + ' packages.');
