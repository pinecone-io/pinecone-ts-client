#!/bin/bash

set -eux -o pipefail

version=$1 # e.g. 2024-07
update_pin=${2:-} # pass --update-pin to check out the apis repo's latest main
modules=("db_control" "db_data" "inference" "assistant_control" "assistant_data" "assistant_evaluation" "admin")

destination="src/pinecone-generated-ts-fetch"
build_dir="build"

case "$update_pin" in
"" | "--update-pin") ;;
*)
	echo "Unrecognized argument: $update_pin (expected --update-pin or nothing)" >&2
	exit 1
	;;
esac

require_apis_submodule_initialized() {
	# An uninitialized submodule leaves codegen/apis as an empty directory. `pushd`
	# into it still succeeds, and git then walks up to this repository's own
	# .git, so any git command run from there would operate on the client repo
	# instead of the submodule. Fail before that can happen.
	if [ ! -e "codegen/apis/.git" ]; then
		echo "codegen/apis is not initialized (submodule directory is empty)." >&2
		echo "Run 'git submodule update --init' and re-run this script." >&2
		exit 1
	fi
}

update_apis_repo() {
	require_apis_submodule_initialized

	if [ "$update_pin" = "--update-pin" ]; then
		echo "Checking out codegen/apis at the apis repo's latest main"
		echo "This does not update this repository's recorded pin -- commit the new codegen/apis pointer separately if you want to keep it"
		pushd codegen/apis
			git fetch
			git checkout main
			git pull
		popd
	else
		echo "Checking out codegen/apis at the commit pinned by this repository"
		git submodule update --init -- codegen/apis
	fi

	pushd codegen/apis
		just clean
		just build
	popd
}

verify_spec_version() {
	local version=$1
	echo "Verifying spec version $version exists in apis repo"
	if [ -z "$version" ]; then
		echo "Version is required"
		exit 1
	fi

	verify_directory_exists "codegen/apis/_build/${version}"
}

verify_file_exists() {
	local filename=$1
	if [ ! -f "$filename" ]; then
		echo "File does not exist at $filename"
		exit 1
	fi
}

verify_directory_exists() {
	local directory=$1
	if [ ! -d "$directory" ]; then
		echo "Directory does not exist at $directory"
		exit 1
	fi
}

generate_client() {
	local module_name=$1

	oas_file="codegen/apis/_build/${version}/${module_name}_${version}.oas.yaml"
	
	verify_file_exists $oas_file

	# Cleanup previous build files
	echo "Cleaning up previous build files"
	rm -rf "${build_dir}"

	# Generate client module
	docker run --rm -v $(pwd):/workspace openapitools/openapi-generator-cli:v7.0.0 generate \
		--input-spec "/workspace/$oas_file" \
		--generator-name typescript-fetch \
		--output "/workspace/${build_dir}"

	# Copy the generated module to the correct location
	rm -rf "${destination}/${module_name}"
	mkdir -p "${destination}/${module_name}"
	cp -r ${build_dir}/* "${destination}/${module_name}"

	echo "export const X_PINECONE_API_VERSION = '${version}';" > ${destination}/${module_name}/api_version.ts
	echo "export * from './api_version';" >> ${destination}/${module_name}/index.ts
}

# Generated TypeScript code attempts to internally map OpenAPI fields that begin
# with "_" to a non-underscored alternative. Along with a polymorphic object,
# this causes collisions and headaches. We massage the generated models to
# maintain the original field names from the OpenAPI spec and circumvent
# the remapping behavior as this is simpler for now than creating a fully
# custom java generator class.
clean_oas_underscore_manipulation() {
	db_data_destination="${destination}/db_data/models"

	# echo "cleaning up Hit.ts"
	sed -i '' \
	-e 's/id:/_id:/g' \
	-e 's/score:/_score:/g' \
	-e "s/'id'/'_id'/g" \
	-e "s/'score'/'_score'/g" \
	-e 's/"id"/"_id"/g' \
	-e 's/"score"/"_score"/g' \
	-e 's/\.id/\._id/g' \
	-e 's/\.score/\._score/g' \
	"${db_data_destination}/Hit.ts"
}

update_apis_repo
verify_spec_version $version

rm -rf "${destination}"
mkdir -p "${destination}"

for module in "${modules[@]}"; do
	generate_client $module
	sleep 1
done

clean_oas_underscore_manipulation
