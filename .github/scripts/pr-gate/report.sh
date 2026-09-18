#!/usr/bin/env bash
# report.sh — Post gate results to the PR: idempotent summary comment + commit status.
# BR-GATE-10/11/14. Uses gh (authenticated via ephemeral GITHUB_TOKEN/GH_TOKEN).
# No secrets are printed.
#
# Env:
#   GH_TOKEN / GITHUB_TOKEN   gh auth
#   GITHUB_REPOSITORY         owner/repo (provided by Actions)
#   PR_NUMBER                 pull request number
#   HEAD_SHA                  head commit sha (status target)
# Args:
#   $1 verdict   PASS | FAIL_STAGE1 | FAIL_STAGE2 | ERROR
#   $2 summary   markdown body (already assembled by the workflow)
set -uo pipefail

VERDICT="${1:?verdict required}"
BODY="${2:-}"
MARKER="<!-- pr-test-quality-gate -->"
CONTEXT="pr-test-quality-gate"

command -v gh >/dev/null 2>&1 || { echo "gh not available" >&2; exit 3; }
: "${GITHUB_REPOSITORY:?}"; : "${PR_NUMBER:?}"; : "${HEAD_SHA:?}"

# Map verdict -> commit status state + description (BR-GATE-10).
case "$VERDICT" in
  PASS)         state="success"; desc="All checks passed" ;;
  FAIL_STAGE1)  state="failure"; desc="Tests/coverage gate failed" ;;
  FAIL_STAGE2)  state="failure"; desc="Tests do not validate business rules" ;;
  ERROR|*)      state="failure"; desc="Gate error (fail-closed)" ;;
esac

# --- idempotent comment upsert (BR-GATE-14) ---
full_body="${MARKER}
${BODY}"
existing_id="$(gh api "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" \
  --jq ".[] | select(.body | startswith(\"$MARKER\")) | .id" 2>/dev/null | head -n1 || true)"

if [ -n "$existing_id" ]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$existing_id" \
    -f body="$full_body" >/dev/null 2>&1 || echo "warn: comment update failed" >&2
else
  gh api -X POST "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" \
    -f body="$full_body" >/dev/null 2>&1 || echo "warn: comment create failed" >&2
fi

# --- commit status (the required check) ---
gh api -X POST "repos/$GITHUB_REPOSITORY/statuses/$HEAD_SHA" \
  -f state="$state" -f context="$CONTEXT" -f description="$desc" >/dev/null 2>&1 \
  || echo "warn: status update failed" >&2

# Exit non-zero on a blocking verdict so the job also reflects failure.
case "$VERDICT" in
  PASS) exit 0 ;;
  *)    exit 1 ;;
esac
