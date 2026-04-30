'use strict';

const STABLE_TAG_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;
const BETA_TAG_RE = /^v?(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/;
const CLOSING_PHRASE_RE =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b\s*:?\s+((?:#\d+|[\s,;&]|\band\b)+)/gi;

function parseStableVersion(value) {
  const match = String(value || '').trim().match(STABLE_TAG_RE);
  if (!match) {
    throw new Error(`Invalid stable version: ${value}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function findLatestStableVersion(tags) {
  return tags
    .map((tag) => (String(tag).match(STABLE_TAG_RE) ? parseStableVersion(tag) : null))
    .filter(Boolean)
    .sort(compareVersions)
    .pop();
}

function computeNextBetaVersion(stableVersion, existingTags) {
  const stable = parseStableVersion(stableVersion);
  const maxBeta = existingTags.reduce((max, tag) => {
    const match = String(tag).match(BETA_TAG_RE);
    if (!match) {
      return max;
    }
    const [, major, minor, patch, beta] = match.map(Number);
    if (major !== stable.major || minor !== stable.minor || patch !== stable.patch) {
      return max;
    }
    return Math.max(max, beta);
  }, 0);

  return {
    stable: `${stable.major}.${stable.minor}.${stable.patch}`,
    version: `${stable.major}.${stable.minor}.${stable.patch}-beta.${maxBeta + 1}`,
  };
}

function parseClosingIssueNumbers(text) {
  const issues = new Set();
  for (const match of String(text || '').matchAll(CLOSING_PHRASE_RE)) {
    const refs = match[1].match(/#(\d+)/g) || [];
    refs.forEach((ref) => issues.add(Number(ref.slice(1))));
  }
  return [...issues].sort((a, b) => a - b);
}

function parsePullNumbersFromMergeSubjects(text) {
  const pulls = new Set();
  for (const line of String(text || '').split(/\r?\n/)) {
    const match =
      line.match(/^Merge pull request #(\d+)\b/i) ||
      line.match(/^Merge PR #(\d+)\b/i);
    if (match) {
      pulls.add(Number(match[1]));
    }
  }
  return [...pulls].sort((a, b) => a - b);
}

module.exports = {
  computeNextBetaVersion,
  findLatestStableVersion,
  parseClosingIssueNumbers,
  parsePullNumbersFromMergeSubjects,
  parseStableVersion,
};
