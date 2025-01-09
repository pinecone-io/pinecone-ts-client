#!/bin/bash

set -eux -o pipefail

version=$1 # e.g. 2024-07
modules=("db_control" "db_data" "inference" "assistant_control" "assistant_data" "assistant_evaluation")

destination="src/pinecone-generated-ts-fetch"
build_dir="build"

update_apis_repo() {
	echo "Updating apis repo"
	pushd codegen/apis
	  git fetch
	  git checkout main
	  git pull
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

update_apis_repo
verify_spec_version $version

rm -rf "${destination}"
mkdir -p "${destination}"

for module in "${modules[@]}"; do
	generate_client $module
	sleep 1
done
