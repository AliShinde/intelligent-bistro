// Runs every backend test script sequentially; aggregates exit codes.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const suites = [
  'src/services/menuMatcher.test.ts',
  'src/services/matchRescue.test.ts',
  'src/services/commands.test.ts',
];

let failed = 0;
for (const suite of suites) {
  console.log(`\n=== ${suite} ===`);
  const result = spawnSync(`npx ts-node "${path.resolve(suite)}"`, { stdio: 'inherit', shell: true });
  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log('\nall suites passed');
