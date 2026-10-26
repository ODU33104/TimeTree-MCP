import { spawnSync } from 'node:child_process';

const steps = [
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['tests', 'npm', ['test']],
  ['dependency audit', 'npm', ['audit', '--audit-level=high']],
];
for (const [label, command, args] of steps) {
  console.log(`[release gate] Running ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    console.error(`[release gate] Unable to execute ${label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[release gate] ${label} failed`);
    process.exit(result.status || 1);
  }
}
console.log('[release gate] Automated checks passed. Live integration and security approval remain separate gates.');
