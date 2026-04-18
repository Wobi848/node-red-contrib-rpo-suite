#!/usr/bin/env node
// Sync rpo-suite dependency versions to match the actual local package versions.
// Bumps rpo-suite patch version when changes are made.

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const suitePkgPath = path.join(base, 'rpo-suite', 'package.json');
const suite = JSON.parse(fs.readFileSync(suitePkgPath, 'utf8'));

const dirs = fs.readdirSync(base).filter(d => {
  try {
    return fs.statSync(path.join(base, d)).isDirectory()
      && fs.existsSync(path.join(base, d, 'package.json'));
  } catch (e) { return false; }
});

const nameToVer = {};
for (const d of dirs) {
  if (d === 'rpo-suite') continue;
  try {
    const p = JSON.parse(fs.readFileSync(path.join(base, d, 'package.json'), 'utf8'));
    nameToVer[p.name] = p.version;
  } catch (e) {}
}

const deps = suite.dependencies || {};
let updated = 0;
const changes = [];
for (const name of Object.keys(deps)) {
  const actual = nameToVer[name];
  if (!actual) {
    changes.push('MISSING in repo: ' + name);
    continue;
  }
  const pinned = deps[name].replace(/[^0-9.]/g, '');
  if (actual !== pinned) {
    changes.push(name + ': ' + pinned + ' -> ' + actual);
    deps[name] = '^' + actual;
    updated++;
  }
}

if (updated === 0) {
  console.log('rpo-suite dependencies already in sync.');
  process.exit(0);
}

suite.dependencies = deps;
const parts = suite.version.split('.').map(Number);
parts[2]++;
const oldVer = suite.version;
suite.version = parts.join('.');

fs.writeFileSync(suitePkgPath, JSON.stringify(suite, null, 2) + '\n');

console.log('Updated ' + updated + ' dependencies:');
for (const c of changes) console.log('  ' + c);
console.log('---');
console.log('rpo-suite: ' + oldVer + ' -> ' + suite.version);
