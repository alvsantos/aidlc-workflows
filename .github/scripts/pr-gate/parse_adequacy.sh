#!/usr/bin/env bash
# parse_adequacy.sh — PURE helper. Parses the Kiro CLI Stage 2 JSON output.
# BR-GATE-08: expected shape {"verdict":"PASS|FAIL","rationale":"...",
#             "business_rules_considered":[...]}
#
# Input:  JSON text on stdin (the Kiro CLI stdout).
# Output: "PASS" | "FAIL" | "ERROR" on stdout; rationale on fd 3 if provided.
# Exit:   0 always (verdict on stdout). Malformed/unparseable input -> "ERROR"
#         (fail-closed, BR-GATE-12). Never crashes on bad input.
set -uo pipefail

command -v jq >/dev/null 2>&1 || { echo "ERROR"; exit 0; }

raw="$(cat 2>/dev/null || true)"

# Some CLIs wrap JSON in prose; extract the first {...} block if present.
json="$(printf '%s' "$raw" | sed -n '0,/}/{/{/,/}/p}' 2>/dev/null || true)"
[ -n "$json" ] || json="$raw"

verdict="$(printf '%s' "$json" | jq -r '.verdict // empty' 2>/dev/null || true)"

case "$verdict" in
  PASS|FAIL)
    rationale="$(printf '%s' "$json" | jq -r '.rationale // ""' 2>/dev/null || true)"
    # Emit rationale on fd 3 when open (caller may capture it); ignore if not.
    { printf '%s' "$rationale" >&3; } 2>/dev/null || true
    echo "$verdict"
    ;;
  *)
    echo "ERROR"
    ;;
esac
