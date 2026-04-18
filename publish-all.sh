#!/bin/bash

# Auto-discovers all folders containing a package.json and publishes them.
# rpo-suite is always published last because it depends on the other packages.

BASE_DIR="/c/Coding/NodeRedPlugin"

# Collect all dirs with package.json, excluding rpo-suite and node_modules
mapfile -t DIRS < <(
  cd "$BASE_DIR" || exit 1
  for d in */; do
    d="${d%/}"
    [ "$d" = "node_modules" ] && continue
    [ "$d" = "rpo-suite" ] && continue
    [ -f "$d/package.json" ] && echo "$d"
  done | sort
)
# rpo-suite last
DIRS+=("rpo-suite")

# Check npm login
if ! npm whoami &>/dev/null; then
  echo "Not logged in to npm. Please run: npm login"
  exit 1
fi

echo "Logged in as: $(npm whoami)"
echo "Discovered ${#DIRS[@]} packages to publish"

OK=0
FAIL=0
FAILED_LIST=()

LOG="$BASE_DIR/publish-log.txt"
echo "Publish run $(date)" > "$LOG"
echo "==============================" >> "$LOG"

for dir in "${DIRS[@]}"; do
  echo "--- $dir ---" | tee -a "$LOG"
  cd "$BASE_DIR/$dir" || continue
  output=$(npm publish 2>&1)
  exitcode=$?
  echo "$output" >> "$LOG"
  if [ $exitcode -eq 0 ]; then
    ver=$(node -p "require('./package.json').version" 2>/dev/null)
    echo "  OK v$ver" | tee -a "$LOG"
    ((OK++))
  else
    echo "  FAILED (exit $exitcode)" | tee -a "$LOG"
    echo "$output" | tail -3 | tee -a "$LOG"
    ((FAIL++))
    FAILED_LIST+=("$dir")
  fi
done

echo "==============================" | tee -a "$LOG"
echo "OK: $OK / $((OK+FAIL))" | tee -a "$LOG"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  echo "FAILED:" | tee -a "$LOG"
  for f in "${FAILED_LIST[@]}"; do echo "  - $f" | tee -a "$LOG"; done
fi
