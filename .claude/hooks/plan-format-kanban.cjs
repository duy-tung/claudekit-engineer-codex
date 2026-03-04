#!/usr/bin/env node
/**
 * PostToolUse hook — warns when plan.md uses filenames as link text instead of human-readable names.
 * Reads stdin JSON from Claude, checks file_path and content for bad link text patterns.
 * Always fail-open: returns { continue: true } on any error.
 */

'use strict';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    // Only check plan.md files
    if (!filePath.endsWith('/plan.md')) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    // Read the file and check for filename-as-link-text pattern
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    // Matches: [phase-01a-some-name.md](./...) — filename used as link text
    const badPattern = /\|\s*\d+[a-z]?\s*\|\s*\[phase-\d+[a-z]?-[^\]]*\.md\]\(/gi;
    const matches = content.match(badPattern);

    if (matches && matches.length > 0) {
      const warning = [
        '[!] plan.md: Link text should be human-readable, not filenames.',
        `    Found ${matches.length} instance(s) using filename as link text.`,
        '    Bad:  [phase-01-setup.md](./phase-01-setup.md)',
        '    Good: [Setup Environment](./phase-01-setup.md)',
        '    Update link text to descriptive phase names for better readability.'
      ].join('\n');

      process.stdout.write(JSON.stringify({ continue: true, additionalContext: warning }));
      return;
    }

    process.stdout.write(JSON.stringify({ continue: true }));
  } catch (_err) {
    // Fail-open: never block on hook errors
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
