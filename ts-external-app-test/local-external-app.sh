#!/bin/bash

set -eu -o pipefail

# Must have API set
if [ -z "$PINECONE_API_KEY" ]; then
  echo "Please set the PINECONE_API_KEY environment variable."
  exit 1
fi

# Build the SDK first
echo "Building SDK..."
npm run build

(
  cd ts-client-test-external-app || exit 1

  git pull origin main 2>/dev/null || true  # Ignore if not a git repo
  npm install  # Install from file:.. automatically
  next dev & # `&` runs the command in the background
)

# Wait for the server to be ready
echo "Waiting for Next.js server to start..."
max_attempts=30
attempt=0
until curl --silent --head http://localhost:3000/ > /dev/null; do
  if [ $attempt -eq $max_attempts ]; then
    echo "Next.js server failed to start within the expected time."
    exit 1
  fi
  attempt=$((attempt+1))
  sleep 2
done

# Run test file
echo "Running tests..."
localUrl='http://localhost:3000/api'
tsx ./assertResponse.ts "$localUrl"


# Kill Next.js server
echo "Killing Next.js server..."
kill $(lsof -t -i:3000)