#!/usr/bin/env bash
# Run from the repository root after selecting Node with `nvm use`.
set -euo pipefail

package_manager=$(node -p "require('./package.json').packageManager")
if [[ ! "$package_manager" =~ ^npm@[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo 'package.json must declare an exact npm version in packageManager.' >&2
  exit 1
fi

npm install --global "$package_manager" --no-audit --no-fund
hash -r
if [[ "$(npm --version)" != "${package_manager#npm@}" ]]; then
  echo "Expected $package_manager on PATH after installation; check your Node/npm installation." >&2
  exit 1
fi
node --version
npm --version
