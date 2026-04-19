#!/usr/bin/env node
// Bumps patch version on every package (except rpo-suite), then runs sync-deps
// so rpo-suite.dependencies and rpo-suite.version follow along.
//
// Usage: node scripts/bump-all.js [--dry]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const base = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry');

const dirs = fs.readdirSync(base).filter(d => {
  if (d === 'rpo-suite' || d === 'node_modules' || d === 'scripts') return false;
  try {
    return fs.statSync(path.join(base, d)).isDirectory()
      && fs.existsSync(path.join(base, d, 'package.json'));
  } catch (e) { return false; }
}).sort();

const changes = [];
for (const d of dirs) {
  const pkgPath = path.join(base, d, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const parts = pkg.version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error('SKIP ' + d + ' (non-semver version: ' + pkg.version + ')');
    continue;
  }
  const oldVer = pkg.version;
  parts[2]++;
  pkg.version = parts.join('.');
  changes.push(`${d.padEnd(22)} ${oldVer} -> ${pkg.version}`);
  if (!dry) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

console.log('Patch-bumped ' + changes.length + ' packages' + (dry ? ' (dry run)' : '') + ':');
for (const c of changes) console.log('  ' + c);

if (dry) {
  console.log('\n(dry run — nothing written)');
  process.exit(0);
}

console.log('\nRunning sync-deps...');
execSync('node ' + path.join(__dirname, 'sync-deps.js'), { stdio: 'inherit' });
