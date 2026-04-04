#!/usr/bin/env node
/**
 * check-metadata-deletions.js
 *
 * CI gate: verifies that every file deleted or renamed under claude/ in this PR
 * has a corresponding entry in claude/metadata.json deletions[] array.
 *
 * Usage: node scripts/check-metadata-deletions.js
 * Exit 0 = all accounted for (or no claude/ deletions in diff)
 * Exit 1 = missing entries found
 */

'use strict';

const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

// Resolve repo root relative to this script's location
const repoRoot = path.resolve(__dirname, '..');

/**
 * Returns paths deleted or renamed under claude/ in diff against origin/dev.
 * Both sides of a rename (old path) are checked.
 */
function getDeletedClaudePaths() {
  let diff;
  try {
    diff = execSync('git diff --name-status origin/dev', {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch (err) {
    // If origin/dev doesn't exist (e.g. first run), fall back gracefully
    console.error('[!] Could not run git diff against origin/dev:', err.message);
    process.exit(0);
  }

  const deleted = new Set();

  for (const line of diff.split('\n')) {
    if (!line.trim()) continue;

    const parts = line.split('\t');
    const status = parts[0];

    if (status === 'D') {
      // Deleted: parts[1] is the file path
      const filePath = parts[1];
      if (filePath && filePath.startsWith('claude/')) {
        // Strip the leading "claude/" to match metadata.json convention
        deleted.add(filePath.slice('claude/'.length));
      }
    } else if (status.startsWith('R')) {
      // Renamed: parts[1] is old path, parts[2] is new path
      const oldPath = parts[1];
      if (oldPath && oldPath.startsWith('claude/')) {
        deleted.add(oldPath.slice('claude/'.length));
      }
    }
  }

  return deleted;
}

/**
 * Reads claude/metadata.json and returns the deletions array as a Set.
 * Supports both "path/to/file" and "claude/path/to/file" conventions.
 */
function getRegisteredDeletions() {
  const metaPath = path.join(repoRoot, 'claude', 'metadata.json');
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch (err) {
    console.error('[X] Failed to read claude/metadata.json:', err.message);
    process.exit(1);
  }

  const entries = Array.isArray(meta.deletions) ? meta.deletions : [];
  return new Set(
    entries.map((e) => {
      // Normalize: strip leading "claude/" if present so we compare on bare paths
      return e.startsWith('claude/') ? e.slice('claude/'.length) : e;
    })
  );
}

function main() {
  const deleted = getDeletedClaudePaths();

  if (deleted.size === 0) {
    console.log('[OK] No deleted/renamed files under claude/ — nothing to check.');
    process.exit(0);
  }

  const registered = getRegisteredDeletions();
  const missing = [];

  for (const filePath of deleted) {
    if (!registered.has(filePath)) {
      missing.push(filePath);
    }
  }

  if (missing.length === 0) {
    console.log(`[OK] All ${deleted.size} deleted/renamed claude/ path(s) are registered in metadata.json.`);
    process.exit(0);
  }

  console.error('[X] metadata-deletions check FAILED');
  console.error('');
  console.error('The following deleted/renamed paths are missing from claude/metadata.json deletions[]:');
  for (const p of missing) {
    console.error(`  - ${p}`);
  }
  console.error('');
  console.error('Fix: add each missing path to the deletions[] array in claude/metadata.json');
  process.exit(1);
}

main();
