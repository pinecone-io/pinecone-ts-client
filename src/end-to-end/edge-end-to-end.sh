#!/bin/bash

set -eu -o pipefail

# !! Recommendation: Do not clone the ts-client-e2e-tests repo in local ts-client repo; it'll just cause npm deps issues

# inputs
dir=$1 # required -- directory where you want to clone the ts-client-e2e-tests repo, or where it is already cloned

if [ -z "$dir" ]; then
  echo "Error: Directory path must be provided (either where the ts-client-e2e-tests repo is cloned, or where you
  want to clone it."
  exit 1
fi

  echo "Cloning ts-client-e2e-tests repo"
  if [ -z "$dir" ]; then
      echo "Error: Must provide path to clone the repo"
      exit 1
    # If `dir` is also provided, pushd into that location, clone the repo, popd back out to local ts-client repo
    elif [ -d "$dir" ]; then
      pushd "$dir"
      git clone git@github.com:pinecone-io/ts-client-e2e-tests.git
      popd
    else
      echo "Error: Directory does not exist: $dir"
      exit 1
    fi

# Compile and make a local link to the ts-client repo
npm run build
npm link

# Hop into ts-client-e2e-tests repo, install deps, link local ts-client repo, and start the Next.js server
pushd "$dir/ts-client-e2e-tests"
  npm install
  npm link @pinecone-database/pinecone
  npm install -g next@latest
  next dev
popd

#npm uninstall -g next # Can comment out if do not want to uninstall the global Next.js package

# Run this script with the following command: `npm run test:end-to-end -- <path-for-cloned-repo>`