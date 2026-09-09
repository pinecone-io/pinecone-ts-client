#!/bin/bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ] || [[ ! "$1" =~ ^[0-9]{4}-[0-9]{2}$ ]] || { [ "$#" -eq 2 ] && [ "$2" != "--update-pin" ]; }; then
  echo "Usage: npm run generate:openapi -- <YYYY-MM> [--update-pin]" >&2
  exit 1
fi

bash ./codegen/build-oas.sh "$@"
npm run build
npm run format
