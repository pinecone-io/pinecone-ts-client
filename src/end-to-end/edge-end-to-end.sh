#!/bin/bash

set -eu -o pipefail

if [ -z "$PINECONE_API_KEY" ]; then
  echo "Please set the PINECONE_API_KEY environment variable."
  exit 1
fi

if [ -d "ts-client-e2e-tests" ]; then
  echo "Removing existing ts-client-e2e-tests directory..."
  rm -rf ts-client-e2e-tests
fi

echo "Cloning ts-client-e2e-tests repo..."
pushd .
  git clone git@github.com:pinecone-io/ts-client-e2e-tests.git
  cd ts-client-e2e-tests
  git pull origin main
popd

# Compile ts-client and make a local link
npm run build
npm link

# Hop into ts-client-e2e-tests repo, install deps, link local ts-client repo, and start the Next.js server
pushd "ts-client-e2e-tests"
  git pull origin main
  npm install
  npm link @pinecone-database/pinecone
  npm install -D next@latest
  next dev & # `&` runs the command in the background
popd

# Run tests
echo "Running tests..."
indexName=$(ts-node src/end-to-end/localRuns.ts | grep -v "Test passed!")

# Delete index test created
echo "Deleting index '$indexName'..."
delete_response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "https://api.pinecone.io/indexes/${indexName}" -H \
  "Api-Key: $PINECONE_API_KEY")

if [ "$delete_response" -eq 202 ]; then
  echo "Successfully deleted index: $indexName"
else
  echo "Failed to delete index: $indexName. HTTP status code: $delete_response"
  exit 1
fi

# Kill the Next.js server
echo "Killing Next.js server..."
if lsof -i:3000 > /dev/null; then
  kill "$(lsof -t -i:3000)"
  echo "Next.js server killed."
else
  echo "Next.js server is not running."
fi