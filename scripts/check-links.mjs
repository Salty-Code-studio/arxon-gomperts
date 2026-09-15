#!/usr/bin/env node
// Verifies every local asset reference and internal link in the site's HTML
// resolves to a file that exists. External URLs, anchors, and mailto/tel/wa.me
// links are skipped. Exits 1 on any miss.
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    if (name === 'node_modules' || name === '.git' || name === 'docs') return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const REF = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const SKIP = /^(https?:|data:|mailto:|tel:|#|\/\/)/i;

const misses = [];
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8');
  for (const [, ref] of html.matchAll(REF)) {
    if (SKIP.test(ref)) continue;
    const target = ref.split('#')[0].split('?')[0];
    if (!target) continue;
    const onDisk = resolve(dirname(file), decodeURIComponent(target));
    if (!existsSync(onDisk)) misses.push(`${file} -> ${ref}`);
  }
}

if (misses.length) {
  console.error(`FAIL: ${misses.length} broken reference(s)`);
  for (const m of misses) console.error('  ' + m);
  process.exit(1);
}
console.log('OK: all local references resolve');
