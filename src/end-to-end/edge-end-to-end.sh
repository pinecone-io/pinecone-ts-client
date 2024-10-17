#!/bin/bash

set -eu -o pipefail

# Recommendation: Do not clone the ts-client-e2e-tests repo in local ts-client repo; it'll just cause npm deps issues

# inputs
clone=$1 # required -- `y` or `n` to clone the ts-client-e2e-tests repo
dir=$2 # required -- directory where you want to clone the ts-client-e2e-tests repo, or where it is already cloned

# Ensure `clone` arg is either 'y' or 'n'
if [ "$clone" != "y" ] && [ "$clone" != "n" ]; then
  echo "Error: Clone flag must be 'y' or 'n'."
  exit 1
fi

if [ -z "$dir" ]; then
  echo "Error: Directory path must be provided (either where the ts-client-e2e-tests repo is cloned, or where you
  want to clone it."
  exit 1
fi

# If `clone` is 'y', ensure `dir` is provided
if [ "$clone" == "y" ]; then
  echo "Cloning ts-client-e2e-tests repo"
  if [ -z "$dir" ]; then
      echo "Error: If cloning, must also provide path where you want to clone"
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
elif [ "$clone" == "n" ]; then
  echo "Not cloning ts-client-e2e-tests repo"
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


# npm run test:end-to-end -- y .