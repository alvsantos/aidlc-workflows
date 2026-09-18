#!/usr/bin/env bash
# run_stage1.sh — Stage 1: run each component's tests + coverage, aggregate verdict.
# BR-GATE-03/04/05/06. Fail-closed (SECURITY-15): any runner error -> exit non-zero
# so the caller sets the gate to ERROR.
#
# Env:
#   APP_COVERAGE_MIN   (default 80)
#   INFRA_COVERAGE_MIN (default 80)
# Output (stdout, last line): stage1 verdict "PASS" | "FAIL_STAGE1"
#   plus "STAGE1_APP_COV=<n>" / "STAGE1_INFRA_COV=<n>" lines for reporting.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"   # repo root (.github/scripts/pr-gate -> root)
APP_MIN="${APP_COVERAGE_MIN:-80}"
INFRA_MIN="${INFRA_COVERAGE_MIN:-80}"

app_passed="false"; app_cov="0"
infra_passed="false"; infra_cov="0"

# ---- app: pytest + coverage ----
if [ -d "$ROOT/app" ]; then
  if ( cd "$ROOT" && python -m pytest app/tests/ -q \
        --cov=app --cov-report=xml:"$ROOT/app/coverage.xml" ); then
    app_passed="true"
  fi
  if [ -f "$ROOT/app/coverage.xml" ]; then
    app_cov="$(bash "$HERE/parse_coverage.sh" "$ROOT/app/coverage.xml" xml)" \
      || { echo "app coverage parse failed" >&2; exit 3; }
  else
    echo "app coverage.xml missing" >&2; exit 3
  fi
fi

# ---- infra: npm test + coverage ----
if [ -d "$ROOT/infra" ]; then
  if ( cd "$ROOT/infra" && npm test --silent ); then
    infra_passed="true"
  fi
  # Istanbul json summary is the conventional output location.
  infra_summary="$ROOT/infra/coverage/coverage-summary.json"
  if [ -f "$infra_summary" ]; then
    infra_cov="$(bash "$HERE/parse_coverage.sh" "$infra_summary" json)" \
      || { echo "infra coverage parse failed" >&2; exit 3; }
  else
    echo "infra coverage summary missing ($infra_summary)" >&2; exit 3
  fi
fi

echo "STAGE1_APP_COV=$app_cov"
echo "STAGE1_INFRA_COV=$infra_cov"

verdict="$(bash "$HERE/stage1_verdict.sh" \
  "app:$app_passed:$app_cov:$APP_MIN" \
  "infra:$infra_passed:$infra_cov:$INFRA_MIN")"

echo "$verdict"
