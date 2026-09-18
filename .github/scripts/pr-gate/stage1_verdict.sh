#!/usr/bin/env bash
# stage1_verdict.sh — PURE helper. Aggregates per-component Stage 1 results.
# BR-GATE-04/05/06: Stage 1 PASSES iff every component passed tests AND met its
# coverage threshold.
#
# Input: one component per argument, formatted "name:tests_passed:coverage:min"
#        tests_passed = "true" | "false"
#        coverage,min = integers 0..100
#   e.g. stage1_verdict.sh "app:true:87:80" "infra:true:72:80"
# Output: "PASS" or "FAIL_STAGE1" on stdout, plus per-component detail on stderr.
# Exit:   0 always (verdict is on stdout); 2 usage/format error (fail-closed).
set -euo pipefail

[ "$#" -ge 1 ] || { echo "usage: stage1_verdict.sh <name:tests_passed:cov:min>..." >&2; exit 2; }

verdict="PASS"
for entry in "$@"; do
  IFS=':' read -r name passed cov min <<<"$entry"
  [ -n "$name" ] && [ -n "$passed" ] && [ -n "$cov" ] && [ -n "$min" ] \
    || { echo "bad component entry: '$entry'" >&2; exit 2; }
  case "$cov$min" in *[!0-9]*) echo "non-integer cov/min in '$entry'" >&2; exit 2 ;; esac

  meets="true"
  [ "$cov" -ge "$min" ] || meets="false"

  if [ "$passed" != "true" ] || [ "$meets" != "true" ]; then
    verdict="FAIL_STAGE1"
    echo "component=$name tests_passed=$passed coverage=$cov min=$min meets_threshold=$meets -> FAIL" >&2
  else
    echo "component=$name tests_passed=$passed coverage=$cov min=$min meets_threshold=$meets -> ok" >&2
  fi
done

echo "$verdict"
