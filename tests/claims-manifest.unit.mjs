import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const claims = JSON.parse(await readFile(new URL('../.factory/claims.json', import.meta.url), 'utf8'));
const taggedSources = await Promise.all([
  '../tests/product.spec.ts',
  '../tests/deployment-contract.unit.mjs',
  '../src/main.rs',
].map(path => readFile(new URL(path, import.meta.url), 'utf8')));

test('every declared claim has one dedicated tagged test and one runnable command', () => {
  const ids = claims.map(claim => claim.id);
  assert.equal(new Set(ids).size, ids.length, 'claim ids must be unique');
  for (const claim of claims) {
    assert.match(claim.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(claim.claim && claim.where && claim.test && claim.sandbox, `${claim.id} is incomplete`);
    const tag = `@claim:${claim.id}`;
    const occurrences = taggedSources.reduce((count, source) => count + source.split(tag).length - 1, 0);
    assert.equal(occurrences, 1, `${claim.id} must have exactly one ${tag} test`);
  }
});
