#!/usr/bin/env node
/**
 * Tests for plan-table-parser.cjs
 * Run: node --test .claude/skills/_shared/lib/__tests__/plan-table-parser.test.cjs
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parsePlanPhases, normalizeStatus, filenameToTitle } = require('../plan-table-parser.cjs');

// --- normalizeStatus ---
describe('normalizeStatus', () => {
  it('completed variants', () => {
    assert.strictEqual(normalizeStatus('completed'), 'completed');
    assert.strictEqual(normalizeStatus('done'), 'completed');
    assert.strictEqual(normalizeStatus('✅'), 'completed');
    assert.strictEqual(normalizeStatus('✓'), 'completed');
  });

  it('in-progress variants', () => {
    assert.strictEqual(normalizeStatus('in-progress'), 'in-progress');
    assert.strictEqual(normalizeStatus('active'), 'in-progress');
    assert.strictEqual(normalizeStatus('wip'), 'in-progress');
    assert.strictEqual(normalizeStatus('🔄'), 'in-progress');
  });

  it('pending fallback', () => {
    assert.strictEqual(normalizeStatus('pending'), 'pending');
    assert.strictEqual(normalizeStatus(''), 'pending');
    assert.strictEqual(normalizeStatus(null), 'pending');
  });
});

// --- filenameToTitle ---
describe('filenameToTitle', () => {
  it('converts phase filename to readable title', () => {
    assert.strictEqual(filenameToTitle('phase-01-setup-environment.md'), 'Setup Environment');
  });

  it('returns non-phase filenames unchanged', () => {
    assert.strictEqual(filenameToTitle('plan.md'), 'plan.md');
    assert.strictEqual(filenameToTitle('readme.md'), 'readme.md');
  });

  it('handles acronyms: API, UI, CLI, SDK', () => {
    assert.strictEqual(filenameToTitle('phase-01-setup-cli-sdk.md'), 'Setup CLI SDK');
    assert.strictEqual(filenameToTitle('phase-02-implement-api.md'), 'Implement API');
    assert.strictEqual(filenameToTitle('phase-03-build-ui-components.md'), 'Build UI Components');
  });
});

// --- parsePlanPhases ---
describe('parsePlanPhases', () => {
  it('null/undefined content returns empty array', () => {
    assert.deepStrictEqual(parsePlanPhases(null, '/tmp'), []);
    assert.deepStrictEqual(parsePlanPhases(undefined, '/tmp'), []);
    assert.deepStrictEqual(parsePlanPhases('', '/tmp'), []);
  });

  it('Format 0: header-aware table with Status column', () => {
    const content = `| # | Phase | Status |
|---|-------|--------|
| 1 | Setup | completed |
| 2 | Implementation | in-progress |`;
    const phases = parsePlanPhases(content, '/tmp');
    assert.strictEqual(phases.length, 2);
    assert.strictEqual(phases[0].phaseId, '1');
    assert.strictEqual(phases[0].status, 'completed');
    assert.strictEqual(phases[1].phaseId, '2');
    assert.strictEqual(phases[1].status, 'in-progress');
  });

  it('Format 2: link-first table', () => {
    const content = `| [Phase 1](./phase-01-setup.md) | Setup environment | completed |
| [Phase 2](./phase-02-impl.md) | Implementation | in-progress |`;
    const phases = parsePlanPhases(content, '/tmp');
    assert.strictEqual(phases.length, 2);
    assert.strictEqual(phases[0].phaseId, '1');
    assert.strictEqual(phases[0].status, 'completed');
    assert.strictEqual(phases[1].phaseId, '2');
    assert.strictEqual(phases[1].status, 'in-progress');
  });

  it('phaseId letter is normalized to lowercase', () => {
    const content = `| # | Phase | Status |
|---|-------|--------|
| 1A | Setup Part A | completed |`;
    const phases = parsePlanPhases(content, '/tmp');
    assert.strictEqual(phases.length, 1);
    assert.strictEqual(phases[0].phaseId, '1a');
  });

  it('Format 0: row names parsed correctly with or without trailing pipe', () => {
    const content = `| # | Phase | Status |
|---|-------|--------|
| 1 | Alpha | completed |
| 2 | Beta | pending |`;
    const phases = parsePlanPhases(content, '/tmp');
    assert.strictEqual(phases.length, 2);
    assert.strictEqual(phases[0].name, 'Alpha');
    assert.strictEqual(phases[1].name, 'Beta');
  });
});
