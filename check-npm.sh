#!/bin/bash

# Auto-discovers all packages and checks npm publish status.
# Shows: package name, local version, npm version, and whether a publish is needed.

BASE_DIR="/c/Coding/NodeRedPlugin"

mapfile -t DIRS < <(
  cd "$BASE_DIR" || exit 1
  for d in */; do
    d="${d%/}"
    [ "$d" = "node_modules" ] && continue
    [ -f "$d/package.json" ] && echo "$d"
  done | sort
)

OK=0
NEEDS_PUBLISH=0
MISSING=0
NEED_LIST=()

printf "%-28s %-42s %-10s %-10s %s\n" "FOLDER" "PACKAGE" "LOCAL" "NPM" "STATUS"
echo "-----------------------------------------------------------------------------------------------------"

for dir in "${DIRS[@]}"; do
  pkg=$(cd "$BASE_DIR/$dir" && node -p "require('./package.json').name")
  local_ver=$(cd "$BASE_DIR/$dir" && node -p "require('./package.json').version")
  npm_ver=$(npm view "$pkg" version 2>/dev/null)

  if [ -z "$npm_ver" ]; then
    status="NOT PUBLISHED"
    ((MISSING++))
    NEED_LIST+=("$dir")
  elif [ "$local_ver" = "$npm_ver" ]; then
    status="OK"
    ((OK++))
  else
    status="NEEDS PUBLISH"
    ((NEEDS_PUBLISH++))
    NEED_LIST+=("$dir")
  fi

  printf "%-28s %-42s %-10s %-10s %s\n" "$dir" "$pkg" "$local_ver" "${npm_ver:--}" "$status"
done

echo "-----------------------------------------------------------------------------------------------------"
echo "  In sync:         $OK"
echo "  Needs publish:   $NEEDS_PUBLISH"
echo "  Not on npm yet:  $MISSING"
if [ ${#NEED_LIST[@]} -gt 0 ]; then
  echo ""
  echo "Packages requiring publish:"
  for n in "${NEED_LIST[@]}"; do echo "  - $n"; done
fi
