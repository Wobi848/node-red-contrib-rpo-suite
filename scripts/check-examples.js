#!/usr/bin/env node
// Static checks for the example flows in */examples/*.json (no Node-RED needed):
// - the example uses at least one node type of its own package
// - node settings are known to the node (editor defaults or read as config.<name> in the .js)
// - no wires to outputs the node does not have
// - inject nodes with a topic actually send it (topic listed in props)
// Exits with 1 if any example has problems.

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
// Properties every node may have besides its defaults
const COMMON = new Set(['id', 'type', 'z', 'name', 'x', 'y', 'w', 'h', 'wires', 'g', 'd', 'info', 'l']);

// Top-level keys of the `defaults: { ... }` object inside a registerType call
function defaultKeys(block) {
  const start = block.search(/defaults\s*:\s*\{/);
  if (start === -1) return null;
  let i = block.indexOf('{', start), depth = 0, keys = [], token = '';
  for (; i < block.length; i++) {
    const c = block[i];
    if (c === '{') { depth++; if (depth === 2) keys.push(token.trim().replace(/[:"'\s]/g, '')); token = ''; continue; }
    if (c === '}') { depth--; if (depth === 0) break; continue; }
    if (depth === 1) token = (c === ',') ? '' : token + c;
  }
  return new Set(keys.filter(Boolean));
}

// Settings the runtime reads (config.<name>), e.g. older names still supported
function readConfigKeys(dir) {
  const keys = new Set();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const js = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of js.matchAll(/config\.([A-Za-z_$][\w$]*)/g)) keys.add(m[1]);
  }
  return keys;
}

// type -> { pkg, outputs, defaults } for all node types in the repo
function nodeTypes() {
  const types = {};
  for (const dir of fs.readdirSync(base)) {
    const pkgFile = path.join(base, dir, 'package.json');
    if (!fs.existsSync(pkgFile) || dir === 'node_modules') continue;
    for (const f of fs.readdirSync(path.join(base, dir)).filter(f => f.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(base, dir, f), 'utf8');
      const re = /registerType\(\s*['"]([^'"]+)['"]\s*,\s*\{/g;
      let m;
      while ((m = re.exec(html))) {
        const block = html.slice(m.index, m.index + 4000);
        const outs = block.match(/outputs\s*:\s*(\d+)/);
        const known = defaultKeys(block);
        if (known) readConfigKeys(path.join(base, dir)).forEach(k => known.add(k));
        types[m[1]] = { pkg: dir, outputs: outs ? parseInt(outs[1], 10) : 1, defaults: known };
      }
    }
  }
  return types;
}

function checkExample(file, dir, types) {
  const problems = [];
  let flow;
  try {
    flow = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return ['invalid JSON: ' + e.message];
  }
  const own = Object.keys(types).filter(t => types[t].pkg === dir);
  const isSuite = dir === 'rpo-suite';
  if (!flow.some(n => isSuite ? types[n.type] : own.includes(n.type))) {
    problems.push('uses no node of this package (' + (own.join(', ') || 'none') + ')');
  }
  for (const n of flow) {
    const t = types[n.type];
    const label = (n.name || n.id) + ' (' + n.type + ')';
    if (t && t.defaults) {
      const unknown = Object.keys(n).filter(k => !COMMON.has(k) && !t.defaults.has(k));
      if (unknown.length) problems.push(label + ': unknown settings ' + unknown.join(', '));
    }
    if (t && Array.isArray(n.wires) && n.wires.length > t.outputs) {
      problems.push(label + ': wired to ' + n.wires.length + ' outputs, node has ' + t.outputs);
    }
    if (n.type === 'inject' && n.topic && Array.isArray(n.props) && !n.props.some(p => p.p === 'topic')) {
      problems.push(label + ': topic "' + n.topic + '" is not sent (missing in props)');
    }
    // Node-RED sends props[].v, the editor shows the field: they must match
    if (n.type === 'inject' && Array.isArray(n.props)) {
      n.props.filter(p => (p.p === 'topic' || p.p === 'payload') && p.v !== undefined && String(p.v) !== String(n[p.p] ?? ''))
        .forEach(p => problems.push(label + ': ' + p.p + ' field "' + (n[p.p] ?? '') + '" but sends "' + p.v + '"'));
    }
  }
  return problems;
}

const types = nodeTypes();
let checked = 0, failed = 0;
for (const dir of fs.readdirSync(base).sort()) {
  const exDir = path.join(base, dir, 'examples');
  if (!fs.existsSync(exDir) || !fs.existsSync(path.join(base, dir, 'package.json'))) continue;
  for (const f of fs.readdirSync(exDir).filter(f => f.endsWith('.json'))) {
    checked++;
    const problems = checkExample(path.join(exDir, f), dir, types);
    if (problems.length) {
      failed++;
      console.log('FAIL ' + dir + '/examples/' + f + ':');
      problems.forEach(p => console.log('    - ' + p));
    }
  }
}
console.log(failed ? failed + ' of ' + checked + ' examples have issues.' : 'All ' + checked + ' examples pass.');
process.exit(failed ? 1 : 0);
