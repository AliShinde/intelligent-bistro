// Per-intent regression matrix for chat commands: Add / Remove / Update / Information.
// Drives applyMatcherRescue directly with synthesized Groq-style inputs.
//
// Out of scope: Groq SDK round-trips (non-deterministic), Express route handler,
// frontend chip rendering, Zustand cart mutation, menu integrity.

import { MENU_ITEMS } from '../data/menu';
import { applyMatcherRescue, RawStep } from './matchRescue';
import { check, runSuite, assertStep, finish } from '../test/harness';

const knownIds = new Set(MENU_ITEMS.map((m) => m.id));
const call = (raw: RawStep, full: string) => applyMatcherRescue(raw, knownIds, full, 0);

runSuite('ADD');

check('A1 add wings → confident', () => {
  assertStep(
    call({ action: 'add', item: 'spicy-buffalo-wings', quantity: 1, userPhrase: 'wings' }, 'add wings'),
    { action: 'add', item: 'spicy-buffalo-wings', hasChoices: false, matchKind: 'match' },
  );
});

check('A2 add 2 lemonades → sibling ambiguity', () => {
  assertStep(
    call({ action: 'add', item: 'classic-lemonade', quantity: 2, userPhrase: 'lemonades' }, 'add 2 lemonades'),
    { action: 'none', hasChoices: true, choiceIdsInclude: ['classic-lemonade', 'strawberry-lemonade'],
      pendingActionAction: 'add', pendingActionQuantity: 2 },
  );
});

check('A3 add a sparkling water → confident', () => {
  assertStep(
    call({ action: 'add', item: 'sparkling-water', quantity: 1, userPhrase: 'sparkling water' }, 'add a sparkling water'),
    { action: 'add', item: 'sparkling-water', hasChoices: false },
  );
});

check('A4 add classic lemonade → discriminator suppresses sibling', () => {
  assertStep(
    call({ action: 'add', item: 'classic-lemonade', quantity: 1, userPhrase: 'classic lemonade' }, 'add classic lemonade'),
    { action: 'add', item: 'classic-lemonade', hasChoices: false },
  );
});

check('A5 add potato skins → matcher-driven ambiguity', () => {
  assertStep(
    call({ action: 'add', item: null, quantity: 1, userPhrase: 'potato skins' }, 'add potato skins'),
    { action: 'none', hasChoices: true, pendingActionAction: 'add', matchKind: 'ambiguous' },
  );
});

check('A6 add truffle → ambiguity between truffle pair', () => {
  assertStep(
    call({ action: 'add', item: null, quantity: 1, userPhrase: 'truffle' }, 'add truffle'),
    { action: 'none', hasChoices: true,
      choiceIdsInclude: ['truffle-parmesan-fries', 'truffle-onion-rings'],
      pendingActionAction: 'add' },
  );
});

check('A7 add 2 lemondaes (typo) → sibling ambiguity', () => {
  assertStep(
    call({ action: 'add', item: 'classic-lemonade', quantity: 2, userPhrase: 'lemondaes' }, 'add 2 lemondaes'),
    { action: 'none', hasChoices: true, choiceIdsInclude: ['classic-lemonade', 'strawberry-lemonade'],
      pendingActionAction: 'add', pendingActionQuantity: 2 },
  );
});

runSuite('REMOVE');

check('R1 remove the wings → confident', () => {
  assertStep(
    call({ action: 'remove', item: 'spicy-buffalo-wings', quantity: null, userPhrase: 'wings' }, 'remove the wings'),
    { action: 'remove', item: 'spicy-buffalo-wings', hasChoices: false },
  );
});

check('R2 remove a lemonade → ambiguous, verb preserved', () => {
  assertStep(
    call({ action: 'remove', item: null, quantity: null, userPhrase: 'lemonade' }, 'remove a lemonade'),
    { action: 'none', hasChoices: true, pendingActionAction: 'remove' },
  );
});

check('R3 remove potato skins → ambiguous, verb preserved', () => {
  assertStep(
    call({ action: 'remove', item: null, quantity: null, userPhrase: 'potato skins' }, 'remove potato skins'),
    { action: 'none', hasChoices: true, pendingActionAction: 'remove' },
  );
});

check('R4 remove sushi → not on menu', () => {
  assertStep(
    call({ action: 'remove', item: null, quantity: null, userPhrase: 'sushi' }, 'remove sushi'),
    { action: 'none', hasChoices: false, matchKind: 'none', item: null },
  );
});

runSuite('UPDATE');

check('U1 set lemonade to 3 → ambiguous, qty 3 carried', () => {
  assertStep(
    call({ action: 'update', item: 'classic-lemonade', quantity: 3, userPhrase: 'lemonade' }, 'set lemonade to 3'),
    { action: 'none', hasChoices: true, pendingActionAction: 'update', pendingActionQuantity: 3 },
  );
});

check('U2 change wings to 5 → confident update', () => {
  assertStep(
    call({ action: 'update', item: 'spicy-buffalo-wings', quantity: 5, userPhrase: 'wings' }, 'change wings to 5'),
    { action: 'update', item: 'spicy-buffalo-wings', quantity: 5, hasChoices: false },
  );
});

check('U3 make it 2 of the calamari → confident update', () => {
  assertStep(
    call({ action: 'update', item: 'crispy-calamari', quantity: 2, userPhrase: 'calamari' }, 'make it 2 of the calamari'),
    { action: 'update', item: 'crispy-calamari', quantity: 2, hasChoices: false },
  );
});

runSuite('INFORMATION');

// Invariant: when Groq emits action='none' with empty userPhrase, the rescue
// MUST NOT scan fullUserMessage to fabricate a cart action. Any future change
// that breaks this invariant will make I4 fail.

check('I1 "what is in the loaded potato skins" → no cart action', () => {
  assertStep(
    call({ action: 'none', item: null, quantity: null, userPhrase: '' }, 'what is in the loaded potato skins'),
    { action: 'none', hasChoices: false, item: null, quantity: null },
  );
});

check('I2 "how much are the wings" → no cart action', () => {
  assertStep(
    call({ action: 'none', item: null, quantity: null, userPhrase: '' }, 'how much are the wings'),
    { action: 'none', hasChoices: false, item: null },
  );
});

check('I3 "thanks" → no cart action', () => {
  assertStep(
    call({ action: 'none', item: null, quantity: null, userPhrase: '' }, 'thanks'),
    { action: 'none', hasChoices: false, item: null },
  );
});

check('I4 "tell me about the menu" → invariant: rescue stays inert', () => {
  assertStep(
    call({ action: 'none', item: null, quantity: null, userPhrase: '' }, 'tell me about the menu'),
    { action: 'none', hasChoices: false, item: null },
  );
});

finish();
