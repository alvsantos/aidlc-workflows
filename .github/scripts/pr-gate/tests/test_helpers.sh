#!/usr/bin/env bash
# tests/test_helpers.sh — example-based tests for the pure pr-gate helpers.
# PBT is Partial for this unit and marked N/A for shell glue; these example-based
# tests satisfy the complementary-testing intent (PBT-10).
#
# Run:  bash .github/scripts/pr-gate/tests/test_helpers.sh
# Exit: 0 all pass; 1 any failure.
set -uo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
check() { # check <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then pass=$((pass+1)); # echo "ok: $1";
  else fail=$((fail+1)); echo "FAIL: $1 — expected='$2' actual='$3'"; fi
}

# ---- parse_coverage.sh (XML Cobertura) ----
cat >"$TMP/cov.xml" <<'XML'
<?xml version="1.0" ?>
<coverage line-rate="0.87" branch-rate="0.5"></coverage>
XML
check "xml 0.87 -> 87" "87" "$(bash "$HERE/parse_coverage.sh" "$TMP/cov.xml" xml)"

cat >"$TMP/cov0.xml" <<'XML'
<coverage line-rate="0.0"></coverage>
XML
check "xml 0.0 -> 0" "0" "$(bash "$HERE/parse_coverage.sh" "$TMP/cov0.xml")"

# ---- parse_coverage.sh (JSON Istanbul) ----
if command -v jq >/dev/null 2>&1; then
  cat >"$TMP/cov.json" <<'JSON'
{"total":{"lines":{"pct":72.9}}}
JSON
  check "json 72.9 -> 72" "72" "$(bash "$HERE/parse_coverage.sh" "$TMP/cov.json" json)"
fi

# parse_coverage bad input -> non-zero exit (fail-closed)
if bash "$HERE/parse_coverage.sh" "$TMP/nope.xml" xml >/dev/null 2>&1; then
  check "missing file exits non-zero" "nonzero" "zero"
else
  check "missing file exits non-zero" "nonzero" "nonzero"
fi

# ---- stage1_verdict.sh ----
check "both ok -> PASS" "PASS" \
  "$(bash "$HERE/stage1_verdict.sh" 'app:true:87:80' 'infra:true:80:80' 2>/dev/null)"
check "low coverage -> FAIL_STAGE1" "FAIL_STAGE1" \
  "$(bash "$HERE/stage1_verdict.sh" 'app:true:79:80' 'infra:true:90:80' 2>/dev/null)"
check "failing tests -> FAIL_STAGE1" "FAIL_STAGE1" \
  "$(bash "$HERE/stage1_verdict.sh" 'app:false:99:80' 2>/dev/null)"
check "boundary equal -> PASS" "PASS" \
  "$(bash "$HERE/stage1_verdict.sh" 'app:true:80:80' 2>/dev/null)"

# ---- parse_adequacy.sh ----
if command -v jq >/dev/null 2>&1; then
  check "adequacy PASS" "PASS" "$(printf '{"verdict":"PASS","rationale":"ok"}' | bash "$HERE/parse_adequacy.sh")"
  check "adequacy FAIL" "FAIL" "$(printf '{"verdict":"FAIL","rationale":"no rule coverage"}' | bash "$HERE/parse_adequacy.sh")"
  check "adequacy malformed -> ERROR" "ERROR" "$(printf 'not json' | bash "$HERE/parse_adequacy.sh")"
  check "adequacy empty -> ERROR" "ERROR" "$(printf '' | bash "$HERE/parse_adequacy.sh")"
  check "adequacy unknown verdict -> ERROR" "ERROR" "$(printf '{"verdict":"MAYBE"}' | bash "$HERE/parse_adequacy.sh")"
fi

# ---- compute_verdict.sh ----
check "error wins -> ERROR"        "ERROR"       "$(bash "$HERE/compute_verdict.sh" PASS PASS true)"
check "stage1 fail -> FAIL_STAGE1" "FAIL_STAGE1" "$(bash "$HERE/compute_verdict.sh" FAIL_STAGE1 SKIPPED false)"
check "stage2 error -> ERROR"      "ERROR"       "$(bash "$HERE/compute_verdict.sh" PASS ERROR false)"
check "stage2 fail -> FAIL_STAGE2" "FAIL_STAGE2" "$(bash "$HERE/compute_verdict.sh" PASS FAIL false)"
check "all pass -> PASS"           "PASS"        "$(bash "$HERE/compute_verdict.sh" PASS PASS false)"

echo "-------------------------------------"
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
