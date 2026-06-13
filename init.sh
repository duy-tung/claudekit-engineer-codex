#!/usr/bin/env bash
# Single verification entrypoint for the kit harness (fail-fast).
# Runs the local quality gates in order: static validators (Tier 0), the harness
# self-audit (advisory), and the test suite. Wrapped by `npm run verify`.
set -euo pipefail
cd "$(dirname "$0")"

echo "[verify] Tier 0 — static validators"
python3 eval/tier0_static.py

echo
echo "[verify] harness self-audit (advisory)"
python3 eval/audit_harness.py || true

echo
echo "[verify] test suite"
npm test --silent

echo
echo "[verify] OK"
