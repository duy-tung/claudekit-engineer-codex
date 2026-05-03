#!/usr/bin/env node
/**
 * check-skill-descriptions.js
 *
 * Warn-only lint over claude/skills/<name>/SKILL.md frontmatter `description:`
 * fields. Surfaces patterns that hurt user discoverability:
 *
 *   - "Use this when..." / "Use this skill..." (instructional, not capability-led)
 *   - Maintainer-only markers ([KAI], "maintainer-only", etc.)
 *   - TODO / FIXME / XXX / WIP markers
 *   - Very short (<50 chars) or very long (>800 chars) descriptions
 *   - Missing `description:` field entirely (auto-emitted as a major-severity
 *     finding with rule id `missing-description`; allowlistable like any other rule)
 *
 * Allowlist (`scripts/skill-description-lint-allowlist.json`) lets specific
 * skills opt out of specific rules with required `reason`. Rule IDs in
 * allowlist entries are validated at load time — unknown IDs error out
 * (catches typos like "too_short" vs "too-short").
 *
 * Usage: node scripts/check-skill-descriptions.js
 * Exit 0 always (warn-only mode). To flip to blocking, both:
 *   1. Change `process.exit(0)` at the bottom to honor severity counts
 *   2. Remove `continue-on-error: true` from the
 *      `skill-description-lint` job in `.github/workflows/quality-gates.yml`
 * Doing only one leaves the gate non-blocking. See claude/rules/quality-gates.md.
 */

'use strict';

const { readFileSync, readdirSync, lstatSync } = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const claudeDir = path.join(repoRoot, 'claude');
const allowlistPath = path.join(__dirname, 'skill-description-lint-allowlist.json');

const RULES = [
  {
    id: 'use-this-prefix',
    severity: 'minor',
    test: (desc) => /^\s*Use\s+this\s+(when|skill)/i.test(desc),
    message:
      'Starts with "Use this when/skill" — instructional, not capability-led. Lead with what the skill DOES ("Build X", "Run Y", "Analyze Z").',
  },
  {
    id: 'maintainer-marker',
    severity: 'major',
    test: (desc) => /\[KAI\]|maintainer[- ]only|for\s+kai\b|kai[- ]only/i.test(desc),
    message:
      'Contains maintainer-only marker. If shipped to all users, drop the marker. If genuinely maintainer-only, move out of ck:* namespace.',
  },
  {
    id: 'todo-marker',
    severity: 'major',
    test: (desc) => /\b(TODO|FIXME|XXX|WIP)\b/.test(desc),
    message: 'Contains TODO/FIXME/XXX/WIP. Resolve or remove before shipping.',
  },
  {
    id: 'too-short',
    severity: 'minor',
    test: (desc) => desc.trim().length < 50,
    message:
      'Very short (<50 chars). Add trigger keywords or example use cases so users can match intent.',
  },
  {
    id: 'too-long',
    severity: 'minor',
    test: (desc) => desc.trim().length > 800,
    message:
      'Very long (>800 chars). First 1-2 sentences should convey core value; trim the rest.',
  },
];

function findFiles(dir, predicate) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      results.push(...findFiles(full, predicate));
    } else if (predicate(entry, full)) {
      results.push(full);
    }
  }
  return results;
}

function extractFrontmatterField(content, field) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  // Match `field:` followed by the value. Supports:
  //   field: value
  //   field: "value"
  //   field: 'value'
  //   field: >- (folded scalar — multiline)
  const re = new RegExp(`^${field}:\\s*(.*)$`, 'm');
  const m = fm.match(re);
  if (!m) return null;
  let value = m[1].trim();

  // Folded scalar: collect indented continuation lines
  if (value === '>-' || value === '>') {
    const lines = fm.split('\n');
    const idx = lines.findIndex((l) => l.match(re));
    const collected = [];
    for (let i = idx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^\S/.test(line)) break; // unindented = next field
      collected.push(line.trim());
    }
    return collected.join(' ').trim();
  }

  // Strip surrounding quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function extractName(content) {
  const raw = extractFrontmatterField(content, 'name');
  if (!raw) return null;
  return raw.startsWith('ck:') ? raw.slice(3) : raw;
}

// Known rule IDs (RULES array + the auto-emitted missing-description finding).
// Used to validate allowlist entries — typo'd rule IDs error out instead of
// silently being ignored.
const KNOWN_RULE_IDS = new Set([
  ...RULES.map((r) => r.id),
  'missing-description',
]);

function loadAllowlist() {
  let raw;
  try {
    raw = readFileSync(allowlistPath, 'utf8');
  } catch {
    return new Map();
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`[X] Invalid JSON in allowlist: ${err.message}`);
    process.exit(1);
  }
  // Map<skillName, Set<ruleId>>
  const map = new Map();
  if (Array.isArray(parsed.allowed)) {
    for (const entry of parsed.allowed) {
      if (!entry || typeof entry.skill !== 'string') continue;
      if (!Array.isArray(entry.rules)) continue;
      if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
        console.error(
          `[X] Allowlist entry "${entry.skill}" missing required "reason" field.`
        );
        process.exit(1);
      }
      // Validate rule IDs — catch typos before they silently allow nothing.
      const unknown = entry.rules.filter((id) => !KNOWN_RULE_IDS.has(id));
      if (unknown.length > 0) {
        console.error(
          `[X] Allowlist entry "${entry.skill}" lists unknown rule ID(s): ${unknown.join(', ')}`
        );
        console.error(`    Known rule IDs: ${[...KNOWN_RULE_IDS].sort().join(', ')}`);
        process.exit(1);
      }
      map.set(entry.skill, new Set(entry.rules));
    }
  }
  return map;
}

function main() {
  const skillsDir = path.join(claudeDir, 'skills');
  const skillFiles = findFiles(skillsDir, (entry) => entry === 'SKILL.md');
  const allowlist = loadAllowlist();

  const findings = []; // {skill, file, ruleId, severity, message, snippet}
  let scanned = 0;

  for (const filePath of skillFiles) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`[!] Could not read ${filePath}: ${err.message}`);
      continue;
    }
    const name = extractName(content);
    if (!name) continue;
    // ck:* namespace only
    const rawName = extractFrontmatterField(content, 'name') || '';
    if (!rawName.startsWith('ck:')) continue;

    const description = extractFrontmatterField(content, 'description');
    if (!description) {
      findings.push({
        skill: name,
        file: path.relative(repoRoot, filePath),
        ruleId: 'missing-description',
        severity: 'major',
        message: 'No `description:` field in frontmatter.',
        snippet: '',
      });
      scanned++;
      continue;
    }
    scanned++;

    const skillAllowed = allowlist.get(name) || new Set();
    for (const rule of RULES) {
      if (skillAllowed.has(rule.id)) continue;
      if (rule.test(description)) {
        findings.push({
          skill: name,
          file: path.relative(repoRoot, filePath),
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          snippet: description.slice(0, 100) + (description.length > 100 ? '...' : ''),
        });
      }
    }
  }

  // Group by severity
  const major = findings.filter((f) => f.severity === 'major');
  const minor = findings.filter((f) => f.severity === 'minor');

  if (findings.length === 0) {
    console.log(
      `[OK] skill-descriptions: ${scanned} ck:* description(s) scanned — no warnings.`
    );
    process.exit(0);
  }

  console.log(
    `[i] skill-descriptions: ${scanned} ck:* description(s) scanned, ${findings.length} warning(s) (${major.length} major, ${minor.length} minor).\n`
  );

  if (major.length > 0) {
    console.log(`[!] Major warnings (${major.length}):`);
    for (const f of major) {
      console.log(`  - /ck:${f.skill}  [${f.ruleId}]  ${f.message}`);
      console.log(`    ${f.file}`);
      if (f.snippet) console.log(`    > ${f.snippet}`);
    }
    console.log('');
  }

  if (minor.length > 0) {
    console.log(`[i] Minor warnings (${minor.length}):`);
    for (const f of minor) {
      console.log(`  - /ck:${f.skill}  [${f.ruleId}]  ${f.message}`);
      console.log(`    ${f.file}`);
      if (f.snippet) console.log(`    > ${f.snippet}`);
    }
    console.log('');
  }

  console.log(
    'These warnings are non-blocking (warn-only mode). To silence a rule for a specific skill, add an entry to scripts/skill-description-lint-allowlist.json with a justification.'
  );

  // Warn-only: always exit 0. Flip this once warnings are driven down.
  process.exit(0);
}

main();
