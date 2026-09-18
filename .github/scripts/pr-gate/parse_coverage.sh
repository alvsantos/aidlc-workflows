#!/usr/bin/env bash
# parse_coverage.sh — PURE helper (no network I/O; reads a coverage file path).
# Extracts an integer line-coverage percentage from a coverage report.
# Supports:
#   - Cobertura/pytest-cov XML (coverage.xml)      -> line-rate attribute (0..1)
#   - Istanbul JSON summary (coverage-summary.json) -> total.lines.pct (0..100)
# Usage:   parse_coverage.sh <path> [xml|json]
# Output:  integer 0..100 on stdout
# Exit:    0 ok; 2 usage; 3 parse error (fail-closed — caller treats as ERROR)
#
# BR-GATE-05. Deterministic; example-tested in tests/.
set -euo pipefail

usage() { echo "usage: parse_coverage.sh <path> [xml|json]" >&2; exit 2; }

path="${1:-}"
kind="${2:-}"
[ -n "$path" ] || usage
[ -f "$path" ] || { echo "coverage file not found: $path" >&2; exit 3; }

# Infer kind from extension if not provided.
if [ -z "$kind" ]; then
  case "$path" in
    *.xml) kind="xml" ;;
    *.json) kind="json" ;;
    *) echo "cannot infer coverage kind for: $path" >&2; exit 3 ;;
  esac
fi

pct=""
case "$kind" in
  xml)
    # Cobertura line-rate is a 0..1 float on the root <coverage ... line-rate="0.87">
    rate="$(grep -o 'line-rate="[0-9.]*"' "$path" | head -n1 | grep -o '[0-9.]*' || true)"
    [ -n "$rate" ] || { echo "no line-rate found in $path" >&2; exit 3; }
    # Convert 0..1 float to integer percent (floor).
    pct="$(awk -v r="$rate" 'BEGIN { printf "%d", (r * 100) }')"
    ;;
  json)
    command -v jq >/dev/null 2>&1 || { echo "jq required for json coverage" >&2; exit 3; }
    pct="$(jq -r '.total.lines.pct // empty' "$path" 2>/dev/null || true)"
    [ -n "$pct" ] || { echo "no total.lines.pct in $path" >&2; exit 3; }
    # Floor to integer.
    pct="$(awk -v p="$pct" 'BEGIN { printf "%d", p }')"
    ;;
  *)
    usage
    ;;
esac

# Validate integer range.
case "$pct" in
  ''|*[!0-9]*) echo "parsed coverage not an integer: '$pct'" >&2; exit 3 ;;
esac
[ "$pct" -ge 0 ] && [ "$pct" -le 100 ] || { echo "coverage out of range: $pct" >&2; exit 3; }

echo "$pct"
