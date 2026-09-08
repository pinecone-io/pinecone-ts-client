#!/bin/bash
#
# Without a guard, an uninitialized codegen/apis (an empty directory) lets
# `pushd codegen/apis && git checkout main` walk up to the enclosing repo's
# own .git and switch the caller's branch instead of failing. This asserts
# build-oas.sh refuses to run in that state, on both its default path and
# its --update-pin path (the one that actually reaches `git checkout main`).

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
overall_pass=true

run_case() {
	local case_name="$1"
	shift
	local tmp_repo
	tmp_repo="$(mktemp -d)"

	(
		cd "$tmp_repo"
		git init -q
		git config user.email "test@example.com"
		git config user.name "Test"
		git commit -q --allow-empty -m "initial commit on main"
		if [ "$(git symbolic-ref --short HEAD)" != "main" ]; then
			git branch -q main
		fi
		git checkout -q -b feature

		mkdir -p codegen/apis
		cp "$script_dir/build-oas.sh" codegen/build-oas.sh

		set +e
		output="$(bash codegen/build-oas.sh 2026-04 "$@" 2>&1)"
		exit_code=$?
		set -e

		branch_after="$(git rev-parse --abbrev-ref HEAD)"
		pass=true

		if [ "$exit_code" -eq 0 ]; then
			echo "FAIL [$case_name]: expected a non-zero exit code, got 0"
			pass=false
		fi

		if [ "$branch_after" != "feature" ]; then
			echo "FAIL [$case_name]: expected branch to stay 'feature', but it is now '$branch_after' -- build-oas.sh ran git against the enclosing repo"
			pass=false
		fi

		if ! grep -q "not initialized" <<<"$output"; then
			echo "FAIL [$case_name]: expected a 'not initialized' message, got:"
			echo "$output"
			pass=false
		fi

		[ "$pass" = true ]
	)
	local case_status=$?
	rm -rf "$tmp_repo"
	return "$case_status"
}

if run_case "default"; then
	echo "PASS [default]: build-oas.sh refuses to run against an uninitialized codegen/apis submodule"
else
	overall_pass=false
fi

if run_case "--update-pin" --update-pin; then
	echo "PASS [--update-pin]: build-oas.sh refuses to run against an uninitialized codegen/apis submodule"
else
	overall_pass=false
fi

[ "$overall_pass" = true ]
