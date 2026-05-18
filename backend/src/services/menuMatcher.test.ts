import { strict as assert } from 'node:assert';
import { MENU_ITEMS } from '../data/menu';
import { resolveMenuItem } from './menuMatcher';

let failures = 0;
const fail = (msg: string): void => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};

console.log('menuMatcher sanity checks');

console.log(' self-match');
for (const item of MENU_ITEMS) {
  const r = resolveMenuItem(item.name);
  try {
    assert.equal(r.kind, 'match', `expected 'match' for "${item.name}", got '${r.kind}'`);
    if (r.kind === 'match') {
      assert.equal(r.id, item.id, `expected id '${item.id}' for "${item.name}", got '${r.id}'`);
    }
  } catch (e) {
    fail((e as Error).message);
  }
}

console.log(' no false ambiguity within the live menu');
for (const item of MENU_ITEMS) {
  const r = resolveMenuItem(item.name);
  try {
    assert.notEqual(
      r.kind,
      'ambiguous',
      `"${item.name}" produced 'ambiguous' on the live menu — thresholds too aggressive, or two names genuinely overlap (chip UX is the right answer)`
    );
  } catch (e) {
    fail((e as Error).message);
  }
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nall checks passed');
