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

    const warnings = [];

    if (matches && matches.length > 0) {
      warnings.push(
        '[!] plan.md: Link text should be human-readable, not filenames.',
        `    Found ${matches.length} instance(s) using filename as link text.`,
        '    Bad:  [phase-01-setup.md](./phase-01-setup.md)',
        '    Good: [Setup Environment](./phase-01-setup.md)',
        '    Update link text to descriptive phase names for better readability.'
      );
    }

    // Check for direct status edits in phases table
    if (toolName === 'Edit' || toolName === 'Write') {
      const toolOutput = data.tool_input?.new_string || data.tool_input?.content || '';
      const statusEditPattern = /\|\s*(Pending|In Progress|Completed|In-Progress)\s*\|/gi;
      const editingStatus = statusEditPattern.test(toolOutput);

      // Only warn if editing a plan.md file's phases table
      if (editingStatus) {
        const isPhaseTable = /\|\s*Phase\s*\|\s*Name\s*\|\s*Status\s*\|/i.test(toolOutput);

        // Also check if the edit target contains phase table markers
        const oldString = data.tool_input?.old_string || '';
        const editingPhaseRow = /^\|\s*\d+[a-z]?\s*\|/im.test(oldString) || /^\|\s*\d+[a-z]?\s*\|/im.test(toolOutput);

        if (isPhaseTable || editingPhaseRow) {
          warnings.push(
            '\n[Plan Status Warning] Direct status edit detected in phases table.',
            'Use CLI for deterministic status updates:',
            '  ck plan check <id>          # Mark completed',
            '  ck plan check <id> --start  # Mark in-progress',
            '  ck plan uncheck <id>        # Revert to pending',
            'Direct edits may break canonical format.'
          );
        }
      }
    }

    if (warnings.length > 0) {
      process.stdout.write(JSON.stringify({ continue: true, additionalContext: warnings.join('\n') }));
      return;
    }

    process.stdout.write(JSON.stringify({ continue: true }));
  } catch (_err) {
    // Fail-open: never block on hook errors
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
