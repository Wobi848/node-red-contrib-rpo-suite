#!/bin/bash
# Runs `npm test` in every package folder that has a test directory.
# Exits non-zero if any test suite fails.

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR" || exit 1

PASS=0
FAIL=0
FAIL_LIST=()

for d in */; do
  dir="${d%/}"
  [ "$dir" = "node_modules" ] && continue
  [ "$dir" = "scripts" ] && continue
  [ ! -f "$dir/package.json" ] && continue
  if [ ! -d "$dir/test" ] || [ -z "$(ls "$dir"/test/*_spec.js 2>/dev/null)" ]; then continue; fi

  echo "=== $dir ==="
  cd "$dir"
  if npm test; then
    ((PASS++))
  else
    ((FAIL++))
    FAIL_LIST+=("$dir")
  fi
  cd "$BASE_DIR"
done

echo ""
echo "================================="
echo "Passing: $PASS"
echo "Failing: $FAIL"
if [ ${#FAIL_LIST[@]} -gt 0 ]; then
  echo ""
  echo "Failed packages:"
  for f in "${FAIL_LIST[@]}"; do echo "  - $f"; done
  exit 1
fi
