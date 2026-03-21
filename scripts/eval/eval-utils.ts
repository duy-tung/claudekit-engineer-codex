/**
 * Shared utilities for eval tiers: logging, file scanning, result types.
 */

import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join } from "path";

// ── Result types ────────────────────────────────────────────────────────────

export type Status = "pass" | "fail" | "warn";

export interface CheckResult {
  label: string;
  status: Status;
  message?: string;
}

export interface ScanResult {
  total: number;
  pass: number;
  fail: number;
  warn: number;
  items: CheckResult[];
}

// ── Output helpers ──────────────────────────────────────────────────────────

export function icon(s: Status): string {
  if (s === "pass") return "[OK]";
  if (s === "warn") return "[!] ";
  return "[X] ";
}

export function printSummary(results: CheckResult[]): void {
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const warn = results.filter((r) => r.status === "warn").length;
  console.log(`\nSummary: ${pass} checks passed, ${fail} failed, ${warn} warnings`);
}

export function printLine(r: CheckResult): void {
  console.log(`${icon(r.status)} ${r.label}${r.message ? ` — ${r.message}` : ""}`);
}

// ── File helpers ────────────────────────────────────────────────────────────

/**
 * Return immediate subdirectory names of a directory.
 */
export function listSubdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => {
    try {
      return statSync(join(dir, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Return all files matching an extension recursively.
 */
export function findFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) walk(full);
        else if (entry.endsWith(ext)) results.push(full);
      } catch {
        // skip unreadable
      }
    }
  };
  walk(dir);
  return results;
}

/**
 * Read file safely, return null on error.
 */
export function readFileSafe(p: string): string | null {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/**
 * Resolve project root (two levels up from scripts/eval/).
 */
export function projectRoot(): string {
  return new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
}
