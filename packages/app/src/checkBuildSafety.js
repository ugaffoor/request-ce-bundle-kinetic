const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const memberAppPath = path.resolve(
  __dirname,
  '../../gbmembers/src/redux/sagas/memberApp.js',
);
const memberAppLines = fs.readFileSync(memberAppPath, 'utf8').split('\n');
const debugLine = memberAppLines[406]; // line 407 (0-indexed)
if (debugLine && /if\s*\(\s*true\s*\)/.test(debugLine)) {
  console.error(
    chalk.red(
      '\n⚠  WARNING: memberApp.js line 407 contains `if (true)` — the localhost billing debug block is enabled!\n' +
        '   Change it back to `if (false)` before building.\n',
    ),
  );
  process.exit(1);
}
