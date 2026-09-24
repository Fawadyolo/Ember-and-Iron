#!/usr/bin/env bash
# Claude Code Stop hook (wired in .claude/settings.json).
#
# Runs the static audit every time Claude tries to end its turn. If the audit
# fails, the turn is BLOCKED and the failures are fed back to Claude, which
# must fix them before it can hand anything over. The same failure blocks at
# most 3 times per session (so something Claude cannot fix doesn't loop
# forever); after that every turn ends with a loud warning to the user until
# the audit passes. A NEW or different failure starts blocking again.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
input="$(cat)"

warn() {  # print a Claude Code systemMessage as valid JSON (any characters)
  if command -v node >/dev/null 2>&1; then
    node -e 'console.log(JSON.stringify({ systemMessage: process.argv[1] }))' "$1"
  else
    printf '{"systemMessage": "%s"}\n' "$(printf '%s' "$1" | LC_ALL=C tr -cd 'A-Za-z0-9 .,:;()/_-')"
  fi
}

if ! command -v node >/dev/null 2>&1; then
  warn "Independent audit could NOT run (node is not installed) — nothing has been verified."
  exit 0
fi

session="$(node -e 'try{process.stdout.write(String(JSON.parse(process.argv[1]).session_id||""))}catch{}' "$input" 2>/dev/null)"
state="${TMPDIR:-/tmp}/ember-audit-${session:-nosession}"

out="$(node "$root/tools/audit/static-check.mjs" "$root" 2>&1)"
if [ $? -eq 0 ]; then
  rm -f "$state"
  exit 0
fi

sig="$(printf '%s' "$out" | cksum | cut -d' ' -f1)"
prev_sig="$(cut -d' ' -f1 "$state" 2>/dev/null)"
n="$(cut -d' ' -f2 "$state" 2>/dev/null)"
[ "$sig" = "$prev_sig" ] && n=$(( ${n:-0} + 1 )) || n=1
echo "$sig $n" > "$state"

if [ "$n" -le 3 ]; then
  {
    echo "Independent audit FAILED — do not hand this over yet. Fix every item, re-run"
    echo "\`node tools/audit/static-check.mjs\`, and only then report back:"
    echo "$out"
  } >&2
  exit 2
fi

warn "AUDIT STILL FAILING — nothing in this repo is ready to upload. $(printf '%s' "$out" | tr '\n' ' ')"
exit 0
