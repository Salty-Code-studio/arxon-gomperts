#!/usr/bin/env bash
# Checks every page for horizontal overflow at a true 390px viewport.
# Starts its own server on 8799 and shuts it down afterwards.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
python3 -m http.server 8799 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1.5
fail=0
for p in index about races sponsorship news contact; do
  out=$("$CHROME" --headless --disable-gpu --window-size=600,900 \
      --virtual-time-budget=12000 --dump-dom \
      "http://localhost:8799/scripts/mobile-probe.html?page=$p.html" 2>/dev/null \
    | grep -o '<title>PROBE [^<]*' | sed 's/<title>PROBE //')
  if [ -z "$out" ]; then echo "$p.html: PROBE FAILED TO RUN"; fail=1; continue; fi
  echo "$out" | python3 -c "
import json,sys
d=json.load(sys.stdin)
bad = d['overflow'] != 0 or d['offenders']
print(('FAIL ' if bad else 'ok   ') + d['page'] + '  vw=' + str(d['vw']) +
      '  overflow=' + str(d['overflow']) + '  hamburger=' + d['hamburger'] +
      ('  offenders=' + json.dumps(d['offenders']) if d['offenders'] else ''))
sys.exit(1 if bad else 0)
" || fail=1
done
exit $fail
