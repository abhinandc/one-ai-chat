#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import pc from 'picocolors';

const ROOTS = ['src', 'app', 'packages'].filter(p => {
  try { return statSync(p).isDirectory(); } catch { return false; }
});

const HASH_ALGO = 'sha1';
const offenders = { stem: new Map(), hash: new Map(), todo: [] };

async function* walk(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const res = join(dir, d.name);
    if (d.isDirectory()) yield* walk(res);
    else yield res;
  }
}

function normStem(file) {
  const name = basename(file, extname(file)).toLowerCase();
  return name.replace(/[\s._-]+/g, '');
}

function sha1(buf) {
  return createHash(HASH_ALGO).update(buf).digest('hex');
}

async function scan() {
  for (const root of ROOTS) {
    for await (const file of walk(root)) {
      if (/\.(png|jpe?g|gif|svg|webp|ico|lock|map)$/i.test(file)) continue;
      const buf = readFileSync(file);
      const hash = sha1(buf);
      const stem = normStem(file);
      const txt = buf.toString('utf8');

      const a = offenders.stem.get(stem) || [];
      a.push(file);
      offenders.stem.set(stem, a);

      const b = offenders.hash.get(hash) || [];
      b.push(file);
      offenders.hash.set(hash, b);

      if (/TODO|FIXME/.test(txt)) offenders.todo.push(file);
    }
  }
}

function fail(msg, list) {
  console.error(pc.red(pc.bold(`✖ ${msg}`)));
  for (const item of list) console.error('  -', item);
}

(async () => {
  await scan();

  const dupStems = [...offenders.stem.values()].filter(a => a.length > 1);
  const dupHashes = [...offenders.hash.values()].filter(a => a.length > 1);

  let failed = false;
  if (dupStems.length) {
    failed = true;
    fail('Near-duplicate filenames detected (merge or refactor):', dupStems.flat());
  }
  if (dupHashes.length) {
    failed = true;
    fail('Exact duplicate file contents detected (remove redundancy):', dupHashes.flat());
  }
  if (offenders.todo.length) {
    failed = true;
    fail('TODO/FIXME present in touched directories:', offenders.todo);
  }

  if (failed) process.exit(1);
  console.log(pc.green(pc.bold('✓ Preflight OK')));
})();
