'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RULES,
  FRONTMATTER_PARSE_ERROR,
  extractFrontmatterField,
  extractName,
} = require('./check-skill-descriptions.js');

const useThisRule = RULES.find((r) => r.id === 'use-this-prefix');

test('use-this-prefix: catches "Use this when"', () => {
  assert.equal(useThisRule.test('Use this when X happens'), true);
});

test('use-this-prefix: catches "Use this skill"', () => {
  assert.equal(useThisRule.test('Use this skill for X'), true);
});

test('use-this-prefix: catches widened "Use this for"', () => {
  assert.equal(useThisRule.test('Use this for building X'), true);
});

test('use-this-prefix: catches widened "Use this to"', () => {
  assert.equal(useThisRule.test('Use this to do X'), true);
});

test('use-this-prefix: does NOT catch capability-led prefix', () => {
  assert.equal(useThisRule.test('Build X with Y'), false);
  assert.equal(useThisRule.test('Run tests'), false);
});

test('use-this-prefix: does NOT match "Use this" with no preposition (still kept narrow on the word boundary)', () => {
  // After widening: any of when|skill|for|to followed by word boundary.
  // "Use this approach" has none of the four — should NOT match.
  assert.equal(useThisRule.test('Use this approach to coding'), false);
});

test('extractFrontmatterField: returns sentinel when frontmatter block absent', () => {
  const content = '# Just a heading\n\nNo frontmatter at all.';
  assert.equal(extractFrontmatterField(content, 'description'), FRONTMATTER_PARSE_ERROR);
});

test('extractFrontmatterField: returns sentinel when frontmatter unclosed', () => {
  const content = '---\nname: ck:foo\ndescription: bar\n\nNo closing dashes.';
  assert.equal(extractFrontmatterField(content, 'description'), FRONTMATTER_PARSE_ERROR);
});

test('extractFrontmatterField: returns null when block parsed but field absent', () => {
  const content = '---\nname: ck:foo\n---\nbody';
  assert.equal(extractFrontmatterField(content, 'description'), null);
});

test('extractFrontmatterField: parses simple inline value', () => {
  const content = '---\ndescription: Build X with Y.\n---\nbody';
  assert.equal(extractFrontmatterField(content, 'description'), 'Build X with Y.');
});

test('extractFrontmatterField: strips double quotes', () => {
  const content = '---\ndescription: "Build X."\n---\nbody';
  assert.equal(extractFrontmatterField(content, 'description'), 'Build X.');
});

test('extractFrontmatterField: strips single quotes', () => {
  const content = "---\ndescription: 'Build X.'\n---\nbody";
  assert.equal(extractFrontmatterField(content, 'description'), 'Build X.');
});

test('extractFrontmatterField: handles folded scalar `>-`', () => {
  const content = [
    '---',
    'description: >-',
    '  First line.',
    '  Second line.',
    '---',
    'body',
  ].join('\n');
  assert.equal(extractFrontmatterField(content, 'description'), 'First line. Second line.');
});

test('extractFrontmatterField: handles folded scalar `>`', () => {
  const content = [
    '---',
    'description: >',
    '  Folded text.',
    '---',
    'body',
  ].join('\n');
  assert.equal(extractFrontmatterField(content, 'description'), 'Folded text.');
});

test('extractFrontmatterField: handles literal block scalar `|` (NEW — was previously broken)', () => {
  const content = [
    '---',
    'description: |',
    '  Literal block scalar.',
    '  Second line preserved.',
    '---',
    'body',
  ].join('\n');
  assert.equal(
    extractFrontmatterField(content, 'description'),
    'Literal block scalar. Second line preserved.'
  );
});

test('extractFrontmatterField: handles literal block scalar `|-`', () => {
  const content = [
    '---',
    'description: |-',
    '  Stripped literal.',
    '---',
    'body',
  ].join('\n');
  assert.equal(extractFrontmatterField(content, 'description'), 'Stripped literal.');
});

test('extractName: returns null on parse error', () => {
  const content = 'no frontmatter';
  assert.equal(extractName(content), null);
});

test('extractName: strips ck: prefix', () => {
  const content = '---\nname: ck:foo\n---\nbody';
  assert.equal(extractName(content), 'foo');
});

test('extractName: returns bare name unchanged', () => {
  const content = '---\nname: bar\n---\nbody';
  assert.equal(extractName(content), 'bar');
});
