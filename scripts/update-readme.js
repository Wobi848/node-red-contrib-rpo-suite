#!/usr/bin/env node
// Regenerates the root README.md using categories.json and each node's
// package.json description. Groups nodes by category with one-line descriptions.

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const cats = JSON.parse(fs.readFileSync(path.join(base, 'categories.json'), 'utf8'));

function loadPkg(folder) {
  try {
    return JSON.parse(fs.readFileSync(path.join(base, folder, 'package.json'), 'utf8'));
  } catch (e) {
    return null;
  }
}

// Stats
let totalNodes = 0;
for (const cat of Object.values(cats)) totalNodes += cat.nodes.length;

const sections = [];
for (const [key, cat] of Object.entries(cats)) {
  const rows = cat.nodes.map(folder => {
    const pkg = loadPkg(folder);
    if (!pkg) return `| ${folder} | (missing) | - | - |`;
    const desc = (pkg.description || '').replace(/\|/g, '\\|');
    return `| ${folder} | ${pkg.name} | ${pkg.version} | ${desc} |`;
  });

  sections.push(`### ${cat.title} \`${cat.palette}\`

${cat.description}

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
${rows.join('\n')}
`);
}

const suitePkg = loadPkg('rpo-suite');
const suiteLine = suitePkg
  ? `**Meta-package:** [${suitePkg.name}](rpo-suite/) v${suitePkg.version} — installs everything.`
  : '';

const newReadme = `# node-red-contrib-rpo — Monorepo

Building automation and industrial control nodes for Node-RED by **sr.rpo**.

${totalNodes} nodes organized into ${Object.keys(cats).length} palette categories. Each package is individually available on npm.

${suiteLine}

## Install Everything

\`\`\`bash
npm install node-red-contrib-rpo-suite
\`\`\`

## Palette Categories

In the Node-RED editor palette, nodes are grouped by category:

${Object.values(cats).map(c => `- \`${c.palette}\` — ${c.title} (${c.nodes.length})`).join('\n')}

## Packages by Category

${sections.join('\n')}

## Development

Scripts in \`scripts/\` automate common tasks:

\`\`\`bash
npm run check        # Verify README, locales, data-i18n, examples for all packages
npm run check:npm    # Compare local versions with npm registry
npm run sync         # Sync rpo-suite dependency versions with local versions
npm run readme       # Regenerate this README from categories.json
npm run apply-cats   # Apply categories.json to all node HTML files
npm test             # Run tests in every package with a test/ folder
npm run verify       # Check + test
\`\`\`

\`categories.json\` is the single source of truth for palette grouping. Edit it, then run \`npm run apply-cats && npm run readme\`.

## License

MIT — sr.rpo | wobi848
`;

fs.writeFileSync(path.join(base, 'README.md'), newReadme);
console.log('README.md regenerated with ' + totalNodes + ' nodes in ' + Object.keys(cats).length + ' categories.');

if (suitePkg) {
  const suiteSections = [];
  for (const [key, cat] of Object.entries(cats)) {
    const rows = cat.nodes.map(folder => {
      const pkg = loadPkg(folder);
      if (!pkg) return `| ${folder} | (missing) | - |`;
      const desc = (pkg.description || '').replace(/\|/g, '\\|');
      const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
      return `| ${folder} | [${pkg.name}](${npmUrl}) | ${desc} |`;
    });
    suiteSections.push(`### ${cat.title} \`${cat.palette}\`

${cat.description}

| Folder | Package | Description |
|--------|---------|-------------|
${rows.join('\n')}
`);
  }

  const suiteReadme = `# ${suitePkg.name}

One-line install for the complete sr.rpo building automation node suite for Node-RED.

**v${suitePkg.version}** — bundles ${totalNodes} nodes across ${Object.keys(cats).length} palette categories.

## Installation

\`\`\`bash
npm install ${suitePkg.name}
\`\`\`

Or via Node-RED Palette Manager: Search for \`rpo-suite\`

## Palette Categories

${Object.values(cats).map(c => `- \`${c.palette}\` — ${c.title} (${c.nodes.length})`).join('\n')}

## Included Nodes (${totalNodes})

${suiteSections.join('\n')}

## Use Cases

- HVAC control systems
- Building automation (GLT)
- Industrial process control
- Sensor data processing
- PLC-style logic in Node-RED

## Author

sr.rpo

## License

MIT
`;

  fs.writeFileSync(path.join(base, 'rpo-suite', 'README.md'), suiteReadme);
  console.log('rpo-suite/README.md regenerated with ' + totalNodes + ' nodes.');
}
