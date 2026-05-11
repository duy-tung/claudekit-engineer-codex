'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const installScript = readFileSync(join(__dirname, '..', 'claude', 'skills', 'install.ps1'), 'utf8');

test('PowerShell installer passes package specs to pip as exact arguments', () => {
  assert.match(
    installScript,
    /\$pipArgs = @\("install", \$PackageSpec, "--prefer-binary"\)\s+\$output = & python -m pip @pipArgs/s,
  );
  assert.match(
    installScript,
    /\$pipArgs = @\("install", \$PackageSpec, "--no-binary", \$packageName\)\s+\$output = & python -m pip @pipArgs/s,
  );
  assert.doesNotMatch(installScript, /pip install \$PackageSpec/);
});

test('PowerShell remediation reports failed requirements, not skill names', () => {
  assert.match(installScript, /function Split-FailureItem/);
  assert.match(installScript, /\$firstColon = \$Item\.IndexOf\(':'\)/);
  assert.match(installScript, /\$reasonColon = \$details\.LastIndexOf\(': '\)/);
  assert.match(installScript, /python -m pip install `"\$pkg`"/);
  assert.match(
    installScript,
    /foreach \(\$item in \$Script:FAILED_OPTIONAL\) \{\s+\$failure = Split-FailureItem -Item \$item/s,
  );
});
