#!/usr/bin/env bash
# compute_verdict.sh — PURE helper. Final gate verdict precedence (BR-GATE-09).
#
# Input args:
#   $1 stage1  = "PASS" | "FAIL_STAGE1"
#   $2 stage2  = "PASS" | "FAIL" | "ERROR" | "SKIPPED"   (SKIPPED when Stage 1 failed)
#   $3 error   = "true" | "false"   (any infrastructure/engine error)
# Output: GateVerdict on stdout: PASS | FAIL_STAGE1 | FAIL_STAGE2 | ERROR
# Exit:   0 always; 2 on usage error (fail-closed).
#
# Precedence:
#   1. error==true                 -> ERROR
#   2. stage1 != PASS              -> FAIL_STAGE1
#   3. stage2 == ERROR             -> ERROR
#   4. stage2 == FAIL             -> FAIL_STAGE2
#   5. otherwise                  -> PASS
set -euo pipefail

[ "$#" -eq 3 ] || { echo "usage: compute_verdict.sh <stage1> <stage2> <error>" >&2; exit 2; }
stage1="$1"; stage2="$2"; error="$3"

if [ "$error" = "true" ]; then
  echo "ERROR"; exit 0
fi
if [ "$stage1" != "PASS" ]; then
  echo "FAIL_STAGE1"; exit 0
fi
if [ "$stage2" = "ERROR" ]; then
  echo "ERROR"; exit 0
fi
if [ "$stage2" = "FAIL" ]; then
  echo "FAIL_STAGE2"; exit 0
fi
echo "PASS"
