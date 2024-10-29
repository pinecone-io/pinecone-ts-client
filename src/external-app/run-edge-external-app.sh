#!/bin/bash

set -eu -o pipefail

if [ -z "$PINECONE_API_KEY" ]; then
  echo "Please set the PINECONE_API_KEY environment variable."
  exit 1
fi

if [ -d "ts-client-test-external-app" ]; then
  echo "Removing existing ts-client-test-external-app directory..."
  rm -rf ts-client-test-external-app
fi

echo "Cloning ts-client-test-external-app repo..."
pushd .
  git clone git@github.com:pinecone-io/tts-client-test-external-app.git
  cd ts-client-test-external-app
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
localUrl='http://localhost:3000/api/createSeedQuery'  # TODO: parameterize later for different endpoints
indexName=$(ts-node src/external-app/assertResponse.ts "$localUrl")

# Delete test index test
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
kill $(lsof -t -i:3000)