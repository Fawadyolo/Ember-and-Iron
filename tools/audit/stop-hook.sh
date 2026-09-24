#!/usr/bin/env bash
# Claude Code Stop hook (wired in .claude/settings.json).
#
# Runs the static audit every time Claude tries to end its turn. If the audit
# fails, the turn is BLOCKED and the failures are fed back to Claude, which
# must fix them before it can hand anything over. After 3 consecutive blocks
# in one session it lets the turn end (so a problem Claude cannot fix doesn't
# loop forever) but shows the user a loud warning instead of silence.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
input="$(cat)"
session="$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
counter="${TMPDIR:-/tmp}/ember-audit-blocks-${session:-nosession}"

out="$(node "$root/tools/audit/static-check.mjs" "$root" 2>&1)"
if [ $? -eq 0 ]; then
  rm -f "$counter"
  exit 0
fi

n=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$counter"
if [ "$n" -le 3 ]; then
  {
    echo "Independent audit FAILED — do not hand this over yet. Fix every item, re-run"
    echo "\`node tools/audit/static-check.mjs\`, and only then report back:"
    echo "$out"
  } >&2
  exit 2
fi

rm -f "$counter"
msg="AUDIT STILL FAILING after 3 attempts — nothing in this repo is ready to upload. $(printf '%s' "$out" | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-600)"
printf '{"systemMessage": "%s"}\n' "$msg"
exit 0
