#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildUsageSnapshot,
  getCacheAgeMs,
  isUsageCacheFresh,
  normalizeUtilization,
  readUsageCache,
  refreshUsageCache
} = require('../usage-limits-cache.cjs');

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
    failures.push({ name, error: error.message });
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function tempCachePath(label) {
  return path.join(os.tmpdir(), `ck-usage-cache-test-${label}-${process.pid}-${Date.now()}.json`);
}

async function main() {
  await test('normalizeUtilization accepts live whole-number percentages and 0..1 fractions', async () => {
    assertEqual(normalizeUtilization(37), 37, 'Live payload percentages should be preserved');
    assertEqual(normalizeUtilization(0.37), 37, 'Fractional payloads should still render as percentages');
  });

  await test('buildUsageSnapshot normalizes just the cosmetic 5h and wk chips', async () => {
    const snapshot = buildUsageSnapshot({
      five_hour: { utilization: 37, resets_at: '2026-04-01T00:00:00.000Z' },
      seven_day: { utilization: 0.19, resets_at: '2026-04-06T13:00:00.000Z' },
      seven_day_opus: { utilization: 55, resets_at: '2026-04-06T13:00:00.000Z' }
    }, new Date('2026-03-31T20:00:00.000Z').getTime());

    assertEqual(snapshot?.fiveHourPercent, 37, '5h should preserve current whole-number percentages');
    assertEqual(snapshot?.weekPercent, 19, 'Weekly should still normalize fractional payloads defensively');
    assertTrue(!('sevenDayOpus' in snapshot), 'Cosmetic snapshot should ignore model-specific buckets');
  });

  await test('refreshUsageCache writes available cache from the OAuth usage payload', async () => {
    const cachePath = tempCachePath('available');

    try {
      const result = await refreshUsageCache({
        cachePath,
        accessToken: 'test-token',
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({
            five_hour: { utilization: 37, resets_at: '2026-04-01T00:00:00.000Z' },
            seven_day: { utilization: 19, resets_at: '2026-04-06T13:00:00.000Z' }
          })
        })
      });

      assertTrue(result.ok, 'Expected refreshUsageCache to succeed');
      const cache = readUsageCache(cachePath);
      assertEqual(cache?.status, 'available', 'Cache should be marked available');
      assertEqual(cache?.data?.five_hour?.utilization, 37, '5h utilization should be written');
      assertEqual(cache?.data?.seven_day?.utilization, 19, 'Weekly utilization should be written');
      assertEqual(cache?.snapshot?.fiveHourPercent, 37, 'Snapshot should include normalized 5h percentage');
      assertEqual(cache?.snapshot?.weekPercent, 19, 'Snapshot should include normalized weekly percentage');
    } finally {
      try { fs.unlinkSync(cachePath); } catch {}
    }
  });

  await test('cache age helpers keep refresh decisions off the render path', async () => {
    const freshCache = { timestamp: Date.now() - 5_000 };
    const staleCache = { timestamp: Date.now() - 120_000 };

    assertTrue(getCacheAgeMs(staleCache) >= 120_000 - 50, 'Cache age should be measured from the timestamp field');
    assertTrue(isUsageCacheFresh(freshCache, 60_000), 'Fresh cache should stay on the read-only path');
    assertTrue(!isUsageCacheFresh(staleCache, 60_000), 'Stale cache should be refreshed by hooks, not by statusline');
  });

  await test('refreshUsageCache writes unavailable cache on HTTP failure', async () => {
    const cachePath = tempCachePath('http-failure');

    try {
      const result = await refreshUsageCache({
        cachePath,
        accessToken: 'test-token',
        fetchImpl: async () => ({
          ok: false,
          status: 401,
          json: async () => ({})
        })
      });

      assertTrue(!result.ok, 'Expected refreshUsageCache to fail for non-OK responses');
      const cache = readUsageCache(cachePath);
      assertEqual(cache?.status, 'unavailable', 'Cache should be marked unavailable on failure');
    } finally {
      try { fs.unlinkSync(cachePath); } catch {}
    }
  });

  console.log(`\nPassed: ${passed}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
