#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$SCRIPT_DIR/../runtime/script-runtime.js"

if [[ -f "$RUNTIME" ]]; then
  node "$RUNTIME" validate-local "$@"
  exit $?
fi

if command -v storyspec >/dev/null 2>&1; then
  storyspec validate "$@"
  exit $?
fi

ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
failures=()

for relative in "CONTINUE.md" ".specify/config.json" "stories" "spec/tracking"; do
  if [[ ! -e "$ROOT/$relative" ]]; then
    failures+=("missing: $relative")
  fi
done

if [[ -d "$ROOT/spec/tracking" ]]; then
  while IFS= read -r -d '' file; do
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$file" >/dev/null 2>&1 \
      || failures+=("invalid json: ${file#$ROOT/}")
  done < <(find "$ROOT/spec/tracking" -maxdepth 1 -name '*.json' -type f -print0)
fi

echo "StorySpec local fallback validation"
echo "Runtime and storyspec command were not found; running lightweight checks."

if [[ ${#failures[@]} -gt 0 ]]; then
  echo "Failures: ${#failures[@]}"
  for failure in "${failures[@]}"; do
    echo "  [FAIL] $failure"
  done
  exit 1
fi

echo "Lightweight validation passed."
