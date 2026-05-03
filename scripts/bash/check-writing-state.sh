#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$SCRIPT_DIR/../runtime/script-runtime.js"

if [ ! -f "$RUNTIME" ]; then
  RUNTIME="$SCRIPT_DIR/../../dist/script-runtime.js"
fi

if [ ! -f "$RUNTIME" ]; then
  echo "script-runtime.js not found. Run npm run build or storyspec upgrade first." >&2
  exit 1
fi

node "$RUNTIME" check-writing-state "$@"
