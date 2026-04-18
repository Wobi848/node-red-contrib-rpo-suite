#!/usr/bin/env node
// Reads categories.json and updates every node HTML:
//  - Replaces `category: 'rpo'` with the category's palette name
//  - Replaces `color: '#...'` with the category's color
// Verifies that every folder referenced in categories.json exists and that
// every folder with a package.json is assigned to exactly one category.

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const cats = JSON.parse(fs.readFileSync(path.join(base, 'categories.json'), 'utf8'));

// Collect all folders with a package.json (excluding rpo-suite).
const allFolders = fs.readdirSync(base).filter(d => {
  try {
    return fs.statSync(path.join(base, d)).isDirectory()
      && fs.existsSync(path.join(base, d, 'package.json'))
      && d !== 'rpo-suite'
      && d !== 'node_modules'
      && d !== 'scripts';
  } catch (e) { return false; }
});

// Build folder -> category map, checking for conflicts and missing folders.
const folderToCat = {};
const missingFolders = [];
for (const [key, cat] of Object.entries(cats)) {
  for (const folder of cat.nodes) {
    if (folderToCat[folder]) {
      console.error(`ERROR: folder ${folder} assigned to both ${folderToCat[folder]} and ${key}`);
      process.exit(1);
    }
    folderToCat[folder] = key;
    if (!allFolders.includes(folder)) missingFolders.push(folder);
  }
}
if (missingFolders.length > 0) {
  console.error('ERROR: categories.json references folders that do not exist:');
  for (const f of missingFolders) console.error('  ' + f);
  process.exit(1);
}

const uncategorized = allFolders.filter(f => !folderToCat[f]);
if (uncategorized.length > 0) {
  console.error('ERROR: folders not assigned to any category:');
  for (const f of uncategorized) console.error('  ' + f);
  process.exit(1);
}

// Apply changes.
let updated = 0;
const skipped = [];

for (const folder of allFolders) {
  const catKey = folderToCat[folder];
  const cat = cats[catKey];

  const htmlFiles = fs.readdirSync(path.join(base, folder))
    .filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const filePath = path.join(base, folder, htmlFile);
    let html = fs.readFileSync(filePath, 'utf8');
    const before = html;

    // Replace category: '...' — must appear inside registerType config.
    html = html.replace(
      /(category:\s*)(["'])[^"']*\2/g,
      `$1'${cat.palette}'`
    );

    // Replace color: '#...' — only the top-level color property of registerType.
    // Heuristic: match a color: line that precedes `defaults:` or has quoted hex.
    html = html.replace(
      /(color:\s*)(["'])#[0-9A-Fa-f]{3,8}\2/g,
      `$1'${cat.color}'`
    );

    if (html !== before) {
      fs.writeFileSync(filePath, html);
      updated++;
    } else {
      skipped.push(folder + '/' + htmlFile);
    }
  }
}

console.log('Updated ' + updated + ' HTML file(s).');
if (skipped.length > 0) {
  console.log('No change needed in ' + skipped.length + ' file(s) (already matching or no registerType).');
}

// Summary per category
console.log('\nCategory distribution:');
for (const [key, cat] of Object.entries(cats)) {
  console.log('  ' + cat.palette.padEnd(14) + ' ' + cat.color + '  ' + cat.nodes.length + ' nodes');
}
