#!/usr/bin/env node
// Verifies every local asset reference and internal link in the site's HTML
// resolves to a file that exists. Exits 1 on any miss.
//
// Two passes, because markup is no longer the only place paths live:
//   1. src/href attributes in the markup, with <script> and <style> blocks
//      stripped first (a template literal like src="${s.file}" is not a path).
//   2. quoted asset-looking strings inside <script> blocks, which is where the
//      hero sponsor list and the portfolio sets keep their filenames.
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    // scripts/ holds the verification harness, not site content. Its probe
    // page builds its iframe src at runtime, so scanning it reports phantoms.
    if (['node_modules', '.git', 'docs', 'scripts'].includes(name)) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const REF = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const SKIP = /^(https?:|data:|mailto:|tel:|#|\/\/)/i;
// Quoted strings inside JS that point at a local asset or page.
const JS_ASSET = /["']([^"'\s${}]+\.(?:jpg|jpeg|png|svg|webp|gif|mp4|webm|html))["']/gi;
const SCRIPTS = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const STYLES = /<style\b[^>]*>[\s\S]*?<\/style>/gi;

const misses = [];

function checkPath(file, ref, where) {
  if (SKIP.test(ref)) return;
  const target = ref.split('#')[0].split('?')[0];
  if (!target) return;
  // A template placeholder that survived here is a bug in this script, not a
  // broken asset. Skip rather than report it as a missing file.
  if (target.includes('${') || target.includes('{{')) return;
  const onDisk = resolve(dirname(file), decodeURIComponent(target));
  if (!existsSync(onDisk)) misses.push(`${file} [${where}] -> ${ref}`);
}

for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8');

  // Pass 2 first, while the script bodies are still available.
  for (const [, body] of html.matchAll(SCRIPTS)) {
    for (const [, ref] of body.matchAll(JS_ASSET)) checkPath(file, ref, 'js');
  }

  // Pass 1, on markup only.
  const markup = html.replace(SCRIPTS, '').replace(STYLES, '');
  for (const [, ref] of markup.matchAll(REF)) checkPath(file, ref, 'markup');
}

if (misses.length) {
  console.error(`FAIL: ${misses.length} broken reference(s)`);
  for (const m of misses) console.error('  ' + m);
  process.exit(1);
}
console.log('OK: all local references resolve (markup + js)');
