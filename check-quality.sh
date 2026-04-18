#!/bin/bash

# Quality check for all node packages. Verifies:
#  - README.md exists and has content (> 100 bytes)
#  - locales/{en,de,es}/*.json exist and are non-empty
#  - HTML files contain data-i18n attributes
#  - package.json has repository field
#  - examples/ folder has at least one file
#
# rpo-suite is exempted from README/locales/HTML checks (it's a meta-package).

BASE_DIR="/c/Coding/NodeRedPlugin"
FAIL=0
CHECKED=0

for d in "$BASE_DIR"/*/; do
  dir=$(basename "$d")
  [ "$dir" = "node_modules" ] && continue
  [ ! -f "$d/package.json" ] && continue
  ((CHECKED++))

  issues=()

  if [ "$dir" != "rpo-suite" ]; then
    # README
    if [ ! -f "$d/README.md" ] || [ "$(wc -c < "$d/README.md")" -lt 100 ]; then
      issues+=("README missing/too small")
    fi

    # Locales
    for lang in en de es; do
      file=$(find "$d/locales/$lang" -name "*.json" 2>/dev/null | head -1)
      if [ -z "$file" ] || [ "$(wc -c < "$file")" -lt 10 ]; then
        issues+=("locale $lang empty/missing")
      fi
    done

    # data-i18n in HTML
    htmlfile=$(find "$d" -maxdepth 1 -name "*.html" | head -1)
    if [ -n "$htmlfile" ] && ! grep -q "data-i18n" "$htmlfile"; then
      issues+=("HTML no data-i18n")
    fi

    # examples folder
    if [ ! -d "$d/examples" ] || [ -z "$(ls -A "$d/examples" 2>/dev/null)" ]; then
      issues+=("no examples")
    fi
  fi

  # repository field (applies to all)
  has_repo=$(node -e "const p = require('$d/package.json'); console.log(p.repository ? 'YES' : 'NO')" 2>/dev/null)
  [ "$has_repo" = "NO" ] && issues+=("no repository field")

  if [ ${#issues[@]} -gt 0 ]; then
    echo "FAIL $dir:"
    for i in "${issues[@]}"; do echo "    - $i"; done
    ((FAIL++))
  fi
done

echo ""
echo "==============================================="
if [ $FAIL -eq 0 ]; then
  echo "All $CHECKED packages pass quality checks."
else
  echo "$FAIL of $CHECKED packages have issues."
  exit 1
fi
