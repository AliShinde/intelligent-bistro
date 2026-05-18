import { strict as assert } from 'node:assert';
import { ActionStep, PendingAction } from '../types/index';
import { RescueResult } from '../services/matchRescue';

let failures = 0;
let totalChecks = 0;

export const runSuite = (name: string): void => {
  console.log(`\n${name}`);
};

export const check = (label: string, fn: () => void): void => {
  totalChecks += 1;
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures += 1;
    console.error(`  ✗ ${label}\n    ${(e as Error).message}`);
  }
};

export const finish = (): void => {
  if (failures > 0) {
    console.error(`\n${failures} of ${totalChecks} checks failed`);
    process.exit(1);
  }
  console.log(`\nall checks passed (${totalChecks})`);
};

export interface ExpectedStep {
  action?: ActionStep['action'];
  item?: string | null;
  quantity?: number | null;
  hasChoices?: boolean;
  choiceIdsInclude?: string[];
  pendingActionAction?: PendingAction['action'];
  pendingActionQuantity?: number;
  matchKind?: RescueResult['matchKind'];
}

export const assertStep = (actual: RescueResult, expected: ExpectedStep): void => {
  const s = actual.step;
  if (expected.action !== undefined) assert.equal(s.action, expected.action, `action: expected ${expected.action}, got ${s.action}`);
  if (expected.item === null) assert.ok(s.item === undefined, `item: expected absent, got ${s.item}`);
  else if (expected.item !== undefined) assert.equal(s.item, expected.item, `item: expected ${expected.item}, got ${s.item}`);
  if (expected.quantity === null) assert.ok(s.quantity === undefined, `quantity: expected absent, got ${s.quantity}`);
  else if (expected.quantity !== undefined) assert.equal(s.quantity, expected.quantity, `quantity: expected ${expected.quantity}, got ${s.quantity}`);
  if (expected.hasChoices === true) assert.ok(s.choices && s.choices.length > 0, 'expected choices to be present');
  if (expected.hasChoices === false) assert.ok(!s.choices || s.choices.length === 0, `expected no choices, got ${JSON.stringify(s.choices)}`);
  if (expected.choiceIdsInclude) {
    const ids = (s.choices ?? []).map((c) => c.id);
    for (const id of expected.choiceIdsInclude) {
      assert.ok(ids.includes(id), `choice ${id} missing from ${JSON.stringify(ids)}`);
    }
  }
  if (expected.pendingActionAction !== undefined) {
    assert.equal(s.pendingAction?.action, expected.pendingActionAction, `pendingAction.action: expected ${expected.pendingActionAction}, got ${s.pendingAction?.action}`);
  }
  if (expected.pendingActionQuantity !== undefined) {
    assert.equal(s.pendingAction?.quantity, expected.pendingActionQuantity, `pendingAction.quantity: expected ${expected.pendingActionQuantity}, got ${s.pendingAction?.quantity}`);
  }
  if (expected.matchKind !== undefined) {
    assert.equal(actual.matchKind, expected.matchKind, `matchKind: expected ${expected.matchKind}, got ${actual.matchKind}`);
  }
};
