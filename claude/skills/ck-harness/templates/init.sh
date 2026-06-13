#!/usr/bin/env bash
# Verification entrypoint — make this pass before claiming a feature done.
# Fail-fast: any failing check aborts the run.
set -euo pipefail
cd "$(dirname "$0")"

# TODO: replace the placeholder below with this project's real checks, e.g.:
#   npm install && npm run build && npm test
#   pytest -q
#   cargo build && cargo test
#   go build ./... && go test ./...

echo "[verify] no checks configured yet — add your build/test/lint commands in init.sh."
echo "[verify] (placeholder) OK"
