#!/usr/bin/env node
/**
 * check-skill-descriptions.js
 *
 * Warn-only lint over claude/skills/<name>/SKILL.md frontmatter metadata.
 * Surfaces patterns that hurt agent routing or Claude Code skill listing budget:
 *
 *   - "Use this when..." / "Use this skill..." (instructional, not capability-led)
 *   - Maintainer-only markers ([KAI], "maintainer-only", etc.)
 *   - TODO / FIXME / XXX / WIP markers
 *   - Very short (<50 chars) or very long (>512 chars) descriptions
 *   - Missing `description:` field entirely (auto-emitted as a major-severity
 *     finding with rule id `missing-description`; allowlistable like any other rule)
 *   - Missing `user-invocable: true` on shipped skills
 *   - Missing or risky project skill listing budget settings
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
const { validateReason } = require('./lib/validate-allowlist-reason.js');

const repoRoot = path.resolve(__dirname, '..');
const claudeDir = path.join(repoRoot, 'claude');
const allowlistPath = path.join(__dirname, 'skill-description-lint-allowlist.json');
const settingsPath = path.join(claudeDir, 'settings.json');

const RECOMMENDED_DESC_CHARS = 200;
const MAX_LISTING_DESC_CHARS = 512;
const MIN_SKILL_LISTING_BUDGET_FRACTION = 0.03;

const RULES = [
  {
    id: 'use-this-prefix',
    severity: 'minor',
    test: (desc) => /^\s*Use\s+this\s+(when|skill|for|to)\b/i.test(desc),
    message:
      'Starts with "Use this when/skill/for/to" — instructional, not capability-led. Lead with what the skill DOES ("Build X", "Run Y", "Analyze Z").',
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
    test: (desc) => desc.trim().length > MAX_LISTING_DESC_CHARS,
    message:
      `Very long (>${MAX_LISTING_DESC_CHARS} chars). Claude Code may truncate or omit it from the skill listing; trim to the routing signal.`,
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

// Sentinel returned when frontmatter block (---...---) is absent or unclosed.
// Distinct from `null` which means "block parsed but field missing" — lets
// the caller emit a `frontmatter-parse-error` finding instead of the
// generic `missing-description` one.
const FRONTMATTER_PARSE_ERROR = Symbol('frontmatter-parse-error');

function extractFrontmatterField(content, field) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return FRONTMATTER_PARSE_ERROR;
  const fm = fmMatch[1];
  // Match `field:` followed by the value. Supports:
  //   field: value
  //   field: "value"
  //   field: 'value'
  //   field: >- / > (folded scalar — newlines collapse to spaces)
  //   field: |- / |  (literal block scalar — newlines preserved, joined with space here
  //                   since description is rendered as a single line)
  const re = new RegExp(`^${field}:\\s*(.*)$`, 'm');
  const m = fm.match(re);
  if (!m) return null;
  let value = m[1].trim();

  // Block scalar (folded `>`/`>-` or literal `|`/`|-`): collect indented continuation
  // lines. For a single-line description rendering, both styles join with spaces.
  if (value === '>-' || value === '>' || value === '|-' || value === '|') {
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
  if (!raw || raw === FRONTMATTER_PARSE_ERROR) return null;
  return normalizeSkillName(raw);
}

// Known rule IDs (RULES array + auto-emitted findings).
// Used to validate allowlist entries — typo'd rule IDs error out instead of
// silently being ignored.
const KNOWN_RULE_IDS = new Set([
  ...RULES.map((r) => r.id),
  'missing-description',
  'frontmatter-parse-error',
  'missing-user-invocable-visibility',
  'missing-skill-listing-budget',
  'low-skill-listing-budget',
  'missing-skill-description-cap',
  'high-skill-description-cap',
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
      const reasonResult = validateReason(entry.reason);
      if (!reasonResult.ok) {
        console.error(`[X] Allowlist entry "${entry.skill}" ${reasonResult.error}`);
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

function normalizeSkillName(rawName) {
  if (!rawName || rawName === FRONTMATTER_PARSE_ERROR) return null;
  return rawName.startsWith('ck:') ? rawName.slice(3) : rawName;
}

function formatSkillLabel(rawName, normalizedName) {
  if (rawName.startsWith('ck:')) return `/ck:${normalizedName}`;
  return rawName;
}

function readSettings() {
  try {
    return JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch (err) {
    return { __readError: err.message };
  }
}

function validateSkillListingSettings(settings) {
  const findings = [];
  const file = path.relative(repoRoot, settingsPath);

  if (settings.__readError) {
    findings.push({
      label: 'claude/settings.json',
      file,
      ruleId: 'missing-skill-listing-budget',
      severity: 'major',
      message: `Could not read skill listing settings: ${settings.__readError}`,
      snippet: '',
    });
    return findings;
  }

  const budgetFraction = settings.skillListingBudgetFraction;
  if (budgetFraction === undefined) {
    findings.push({
      label: 'claude/settings.json',
      file,
      ruleId: 'missing-skill-listing-budget',
      severity: 'major',
      message: `Missing skillListingBudgetFraction. Default to ${MIN_SKILL_LISTING_BUDGET_FRACTION} so all Engineer skills stay visible under the Claude Code skill listing budget.`,
      snippet: '',
    });
  } else if (
    typeof budgetFraction !== 'number' ||
    budgetFraction < MIN_SKILL_LISTING_BUDGET_FRACTION
  ) {
    findings.push({
      label: 'claude/settings.json',
      file,
      ruleId: 'low-skill-listing-budget',
      severity: 'major',
      message: `skillListingBudgetFraction must be >= ${MIN_SKILL_LISTING_BUDGET_FRACTION}; got ${JSON.stringify(budgetFraction)}.`,
      snippet: '',
    });
  }

  const maxDescChars = settings.skillListingMaxDescChars;
  if (maxDescChars === undefined) {
    findings.push({
      label: 'claude/settings.json',
      file,
      ruleId: 'missing-skill-description-cap',
      severity: 'major',
      message: `Missing skillListingMaxDescChars. Default to ${MAX_LISTING_DESC_CHARS} to keep individual descriptions bounded.`,
      snippet: '',
    });
  } else if (typeof maxDescChars !== 'number' || maxDescChars > MAX_LISTING_DESC_CHARS) {
    findings.push({
      label: 'claude/settings.json',
      file,
      ruleId: 'high-skill-description-cap',
      severity: 'major',
      message: `skillListingMaxDescChars must be <= ${MAX_LISTING_DESC_CHARS}; got ${JSON.stringify(maxDescChars)}.`,
      snippet: '',
    });
  }

  return findings;
}

function main() {
  const skillsDir = path.join(claudeDir, 'skills');
  const skillFiles = findFiles(skillsDir, (entry) => entry === 'SKILL.md');
  const allowlist = loadAllowlist();
  const settings = readSettings();

  const findings = []; // {skill, file, ruleId, severity, message, snippet}
  findings.push(...validateSkillListingSettings(settings));
  let scanned = 0;
  const descriptions = [];

  for (const filePath of skillFiles) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`[!] Could not read ${filePath}: ${err.message}`);
      continue;
    }
    const rawName = extractFrontmatterField(content, 'name');
    const name = normalizeSkillName(rawName);
    if (!name) {
      // Could be a non-ck: skill OR malformed frontmatter. Distinguish: try
      // to read the name field directly. If extractFrontmatterField returns
      // the sentinel, the frontmatter block itself failed to parse — emit a
      // distinct finding so authors can debug instead of silently skipping.
      if (rawName === FRONTMATTER_PARSE_ERROR) {
        findings.push({
          label: path.basename(path.dirname(filePath)),
          file: path.relative(repoRoot, filePath),
          ruleId: 'frontmatter-parse-error',
          severity: 'major',
          message:
            'Frontmatter block missing or unclosed. Expected `---`-delimited block at top of file.',
          snippet: '',
        });
        scanned++;
      }
      continue;
    }

    const description = extractFrontmatterField(content, 'description');
    if (description === FRONTMATTER_PARSE_ERROR) {
      // Defensive — extractName already handled this above, but keep the
      // branch for clarity if call order ever changes.
      findings.push({
        label: formatSkillLabel(rawName, name),
        file: path.relative(repoRoot, filePath),
        ruleId: 'frontmatter-parse-error',
        severity: 'major',
        message: 'Frontmatter block missing or unclosed.',
        snippet: '',
      });
      scanned++;
      continue;
    }
    if (!description) {
      findings.push({
        label: formatSkillLabel(rawName, name),
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
    descriptions.push(description);

    const skillAllowed = allowlist.get(name) || new Set();
    const userInvocable = extractFrontmatterField(content, 'user-invocable');
    if (!skillAllowed.has('missing-user-invocable-visibility') && userInvocable !== 'true') {
      findings.push({
        label: formatSkillLabel(rawName, name),
        file: path.relative(repoRoot, filePath),
        ruleId: 'missing-user-invocable-visibility',
        severity: 'major',
        message:
          'Shipped skills must set `user-invocable: true`; control listing pressure with budget settings and bounded descriptions, not hidden skills.',
        snippet: '',
      });
    }

    for (const rule of RULES) {
      if (skillAllowed.has(rule.id)) continue;
      if (rule.test(description)) {
        findings.push({
          label: formatSkillLabel(rawName, name),
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
  const totalDescChars = descriptions.reduce((sum, desc) => sum + desc.length, 0);
  const cappedDescChars = descriptions.reduce(
    (sum, desc) => sum + Math.min(desc.length, settings.skillListingMaxDescChars || desc.length),
    0
  );
  const overRecommended = descriptions.filter((desc) => desc.length > RECOMMENDED_DESC_CHARS).length;
  const overCap = descriptions.filter((desc) => desc.length > MAX_LISTING_DESC_CHARS).length;

  console.log(
    `[i] skill inventory: ${scanned} skill description(s), ${totalDescChars} char(s) total, ${overRecommended} over ${RECOMMENDED_DESC_CHARS} chars, ${overCap} over ${MAX_LISTING_DESC_CHARS} chars.`
  );
  console.log(
    `[i] skill listing settings: skillListingBudgetFraction=${JSON.stringify(settings.skillListingBudgetFraction)}, skillListingMaxDescChars=${JSON.stringify(settings.skillListingMaxDescChars)}, projected listed description chars=${cappedDescChars}.\n`
  );

  if (findings.length === 0) {
    console.log(
      `[OK] skill-descriptions: ${scanned} skill description(s) scanned — no warnings.`
    );
    process.exit(0);
  }

  console.log(
    `[i] skill-descriptions: ${scanned} ck:* description(s) scanned, ${findings.length} warning(s) (${major.length} major, ${minor.length} minor).\n`
  );

  if (major.length > 0) {
    console.log(`[!] Major warnings (${major.length}):`);
    for (const f of major) {
      console.log(`  - ${f.label}  [${f.ruleId}]  ${f.message}`);
      console.log(`    ${f.file}`);
      if (f.snippet) console.log(`    > ${f.snippet}`);
    }
    console.log('');
  }

  if (minor.length > 0) {
    console.log(`[i] Minor warnings (${minor.length}):`);
    for (const f of minor) {
      console.log(`  - ${f.label}  [${f.ruleId}]  ${f.message}`);
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

if (require.main === module) {
  main();
}

module.exports = {
  RULES,
  FRONTMATTER_PARSE_ERROR,
  extractFrontmatterField,
  extractName,
};
