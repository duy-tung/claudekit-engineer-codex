#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_FETCH_TIMEOUT_MS = 5_000;
const DEFAULT_USER_AGENT = 'claudekit-engineer/1.0';

function getUsageCachePath() {
  return process.env.CK_USAGE_CACHE_PATH || path.join(os.tmpdir(), 'ck-usage-limits-cache.json');
}

function readUsageCache(cachePath = getUsageCachePath()) {
  try {
    if (!fs.existsSync(cachePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getCacheAgeMs(cache, now = Date.now()) {
  if (!cache || typeof cache.timestamp !== 'number') return Number.POSITIVE_INFINITY;
  return Math.max(0, now - cache.timestamp);
}

function isUsageCacheFresh(cache, maxAgeMs, now = Date.now()) {
  return getCacheAgeMs(cache, now) <= maxAgeMs;
}

function normalizeUtilization(utilization) {
  if (typeof utilization !== 'number' || !Number.isFinite(utilization)) return null;
  if (utilization <= 1) return Math.round(utilization * 100);
  return Math.max(0, Math.round(utilization));
}

function buildUsageSnapshot(data = null, now = Date.now()) {
  if (!data || typeof data !== 'object') return null;

  return {
    sourceVersion: 1,
    fetchedAt: new Date(now).toISOString(),
    fiveHourPercent: normalizeUtilization(data.five_hour?.utilization),
    weekPercent: normalizeUtilization(data.seven_day?.utilization)
  };
}

function writeUsageCache(status, data = null, { cachePath = getUsageCachePath(), now = Date.now() } = {}) {
  const tmpFile = `${cachePath}.${process.pid}.${now}.${Math.random().toString(16).slice(2)}.tmp`;
  const snapshot = status === 'available' ? buildUsageSnapshot(data, now) : null;

  try {
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        timestamp: now,
        status,
        data,
        snapshot
      })
    );
    fs.renameSync(tmpFile, cachePath);
  } catch {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function getClaudeAccessToken() {
  if (os.platform() === 'darwin') {
    try {
      const raw = execSync('security find-generic-password -s "Claude Code-credentials" -w', {
        timeout: 5_000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      const parsed = JSON.parse(raw);
      if (parsed.claudeAiOauth?.accessToken) {
        return parsed.claudeAiOauth.accessToken;
      }
    } catch {}
  }

  try {
    const credentialsPath = path.join(os.homedir(), '.claude', '.credentials.json');
    const parsed = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    return parsed.claudeAiOauth?.accessToken || null;
  } catch {
    return null;
  }
}

async function fetchUsageLimits({
  fetchImpl = fetch,
  fetchTimeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  userAgent = DEFAULT_USER_AGENT,
  accessToken
} = {}) {
  const token = accessToken || getClaudeAccessToken();
  if (!token) {
    return { ok: false, cacheStatus: 'unavailable', note: 'missing-credentials', data: null };
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), fetchTimeoutMs)
    : null;

  try {
    const response = await fetchImpl('https://api.anthropic.com/api/oauth/usage', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': userAgent
      },
      signal: controller?.signal
    });

    if (!response.ok) {
      return { ok: false, cacheStatus: 'unavailable', note: `http-${response.status}`, data: null };
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') {
      return { ok: false, cacheStatus: 'unavailable', note: 'invalid-body', data: null };
    }

    return { ok: true, cacheStatus: 'available', note: 'fetched', data };
  } catch (error) {
    const note = error?.name === 'AbortError' ? 'timeout' : 'fetch-failed';
    return { ok: false, cacheStatus: 'unavailable', note, data: null };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function refreshUsageCache(options = {}) {
  const result = await fetchUsageLimits(options);
  writeUsageCache(result.cacheStatus, result.data, options);

  return {
    ...result,
    cache: readUsageCache(options.cachePath)
  };
}

module.exports = {
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_FETCH_TIMEOUT_MS,
  getUsageCachePath,
  readUsageCache,
  getCacheAgeMs,
  isUsageCacheFresh,
  buildUsageSnapshot,
  writeUsageCache,
  getClaudeAccessToken,
  fetchUsageLimits,
  refreshUsageCache,
  normalizeUtilization
};
