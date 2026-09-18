#!/usr/bin/env bash
# run_stage2.sh — Stage 2: AI business-rule adequacy via Kiro CLI headless.
# BR-GATE-07/08/13/14. Runs ONLY after Stage 1 passes (caller enforces).
# Fetches KIRO_API_KEY from Secrets Manager via OIDC creds (assumed by the workflow),
# masks it, builds an injection-safe prompt, invokes the Kiro CLI with a timeout and
# constrained tools, then parses the JSON verdict. Fail-closed on any error.
#
# Env (from workflow):
#   KIRO_SECRET_ARN         ARN of the Secrets Manager secret holding the Kiro key
#   AWS_REGION              (default us-east-1)
#   STAGE2_TIMEOUT_SECONDS  (default 300)
#   BUSINESS_RULE_CONTEXT   text (relevant business rules)
#   CHANGED_TEST_FILES      text (concatenated changed test files)
# Output (stdout, last line): "PASS" | "FAIL" | "ERROR"
#   Rationale (if any) written to $GITHUB_ENV-style file at $RATIONALE_OUT if set.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REGION="${AWS_REGION:-us-east-1}"
TIMEOUT="${STAGE2_TIMEOUT_SECONDS:-300}"

fail_closed() { echo "$1" >&2; echo "ERROR"; exit 0; }  # verdict on stdout; never crash caller

[ -n "${KIRO_SECRET_ARN:-}" ] || fail_closed "KIRO_SECRET_ARN not set"
command -v aws >/dev/null 2>&1 || fail_closed "aws CLI not available"
command -v kiro-cli >/dev/null 2>&1 || fail_closed "kiro-cli not available"

# --- fetch + mask the Kiro API key (SECURITY-03/12) ---
KEY="$(aws secretsmanager get-secret-value \
        --secret-id "$KIRO_SECRET_ARN" --region "$REGION" \
        --query SecretString --output text 2>/dev/null)" || fail_closed "secret fetch failed"
[ -n "$KEY" ] || fail_closed "empty secret"
echo "::add-mask::$KEY" 2>/dev/null || true
export KIRO_API_KEY="$KEY"

# --- build injection-safe prompt from template ---
tmpl="$HERE/prompt.tmpl"
[ -f "$tmpl" ] || fail_closed "prompt template missing"
prompt="$(cat "$tmpl")"
# Safe substitution via awk (no shell interpretation of the untrusted content).
prompt="${prompt//%%BUSINESS_RULE_CONTEXT%%/${BUSINESS_RULE_CONTEXT:-<none provided>}}"
prompt="${prompt//%%CHANGED_TEST_FILES%%/${CHANGED_TEST_FILES:-<none provided>}}"

# --- invoke Kiro CLI headless, constrained tools, bounded time ---
# NOTE: no --trust-all-tools (BR-GATE-14) since input is untrusted PR content.
out="$(timeout "$TIMEOUT" kiro-cli chat --no-interactive "$prompt" 2>/dev/null)"
rc=$?
if [ "$rc" -ne 0 ]; then
  fail_closed "kiro-cli exited $rc (timeout/failure)"
fi

# --- parse verdict (fail-closed on malformed) ---
rationale=""
verdict="$(printf '%s' "$out" | bash "$HERE/parse_adequacy.sh" 3>/tmp/pr_gate_rationale.$$ )" || verdict="ERROR"
[ -f "/tmp/pr_gate_rationale.$$" ] && rationale="$(cat "/tmp/pr_gate_rationale.$$" 2>/dev/null || true)"
rm -f "/tmp/pr_gate_rationale.$$" 2>/dev/null || true

if [ -n "${RATIONALE_OUT:-}" ]; then
  printf '%s' "$rationale" > "$RATIONALE_OUT" 2>/dev/null || true
fi

echo "$verdict"
