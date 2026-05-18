import { strict as assert } from 'node:assert';
import { MENU_ITEMS } from '../data/menu';
import { applyMatcherRescue } from './matchRescue';

const knownIds = new Set(MENU_ITEMS.map((m) => m.id));
let failures = 0;
const check = (label: string, fn: () => void): void => {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures += 1;
    console.error(`  ✗ ${label}\n    ${(e as Error).message}`);
  }
};

console.log('applyMatcherRescue');

check('confident single step passes through Groq pick', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'spicy-buffalo-wings', quantity: 2, userPhrase: 'wings' },
    knownIds, 'add 2 wings', 0,
  );
  assert.equal(r.step.action, 'add');
  assert.equal(r.step.item, 'spicy-buffalo-wings');
  assert.equal(r.step.quantity, 2);
  assert.equal(r.matchKind, 'match');
  assert.ok(!r.step.choices);
});

check('ambiguous phrase overrides Groq even when item is valid', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'classic-lemonade', quantity: 2, userPhrase: 'lemonade' },
    knownIds, 'add 2 lemonades', 0,
  );
  assert.equal(r.matchKind, 'ambiguous');
  assert.equal(r.step.action, 'none');
  assert.ok(r.step.choices && r.step.choices.length >= 2, 'choices should be populated');
  assert.equal(r.step.pendingAction?.action, 'add');
  assert.equal(r.step.pendingAction?.quantity, 2);
});

check('unknown phrase yields kind:none with action=none', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: null, quantity: null, userPhrase: 'sushi' },
    knownIds, 'add sushi', 0,
  );
  assert.equal(r.matchKind, 'none');
  assert.equal(r.step.action, 'none');
  assert.ok(!r.step.item);
});

check('empty userPhrase + action=none stays as-is', () => {
  const r = applyMatcherRescue(
    { action: 'none', item: null, quantity: null, userPhrase: '' },
    knownIds, 'thanks', 0,
  );
  assert.equal(r.step.action, 'none');
  assert.equal(r.matchKind, 'none');
});

check('rescue picks unique match when Groq gave unknown id', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'made-up-id', quantity: 1, userPhrase: 'calamari' },
    knownIds, 'add a calamari', 0,
  );
  assert.equal(r.matchKind, 'match');
  assert.equal(r.step.item, 'crispy-calamari');
  assert.equal(r.step.action, 'add');
});

check('typo/plural with confident Groq pick still surfaces siblings', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'classic-lemonade', quantity: 2, userPhrase: 'lemondaes' },
    knownIds, 'add 2 lemondaes', 0,
  );
  assert.equal(r.step.action, 'none');
  assert.ok(r.step.choices && r.step.choices.length >= 2, 'siblings should produce chips');
  assert.equal(r.step.pendingAction?.action, 'add');
  assert.equal(r.step.pendingAction?.quantity, 2);
  const ids = r.step.choices!.map((c) => c.id);
  assert.ok(ids.includes('classic-lemonade'));
  assert.ok(ids.includes('strawberry-lemonade'));
});

check('user explicitly specifies a discriminator → confident pick stands', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'classic-lemonade', quantity: 1, userPhrase: 'classic lemonade' },
    knownIds, 'add a classic lemonade', 0,
  );
  assert.equal(r.step.action, 'add');
  assert.equal(r.step.item, 'classic-lemonade');
  assert.ok(!r.step.choices);
});

check('confident pick with no siblings stays confident', () => {
  const r = applyMatcherRescue(
    { action: 'add', item: 'mango-smoothie', quantity: 1, userPhrase: 'mango' },
    knownIds, 'add a mango', 0,
  );
  assert.equal(r.step.action, 'add');
  assert.equal(r.step.item, 'mango-smoothie');
  assert.ok(!r.step.choices);
});

check('remove verb preserved when ambiguous', () => {
  const r = applyMatcherRescue(
    { action: 'remove', item: null, quantity: null, userPhrase: 'lemonade' },
    knownIds, 'remove the lemonade', 0,
  );
  assert.equal(r.matchKind, 'ambiguous');
  assert.equal(r.step.pendingAction?.action, 'remove');
});

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nall checks passed');
