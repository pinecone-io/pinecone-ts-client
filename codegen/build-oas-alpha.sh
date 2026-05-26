#!/bin/bash

set -eux -o pipefail

version="2026-01.alpha"
modules=("db_control" "db_data")

destination="src/pinecone-generated-ts-fetch-alpha"
build_dir="build-alpha"

update_apis_repo() {
	echo "Updating apis repo"
	pushd codegen/apis
		git fetch
		git checkout main
		git pull
	popd
}

verify_file_exists() {
	local filename=$1
	if [ ! -f "$filename" ]; then
		echo "File does not exist at $filename"
		exit 1
	fi
}

generate_client() {
	local module_name=$1

	oas_file="codegen/apis/static/${version}/${module_name}_${version}.oas.yaml"

	verify_file_exists $oas_file

	echo "Cleaning up previous build files"
	rm -rf "${build_dir}"

	docker run --rm -v $(pwd):/workspace openapitools/openapi-generator-cli:v7.0.0 generate \
		--input-spec "/workspace/$oas_file" \
		--generator-name typescript-fetch \
		--output "/workspace/${build_dir}" \
		--additional-properties=supportsES6=true,withoutRuntimeChecks=true,modelPropertyNaming=original,useSingleRequestParameter=true

	rm -rf "${destination}/${module_name}"
	mkdir -p "${destination}/${module_name}"
	cp -r ${build_dir}/* "${destination}/${module_name}"

	echo "export const X_PINECONE_API_VERSION = '${version}';" > ${destination}/${module_name}/api_version.ts
	echo "export * from './api_version';" >> ${destination}/${module_name}/index.ts
}

update_apis_repo

mkdir -p "${destination}"

for module in "${modules[@]}"; do
	generate_client $module
	sleep 1
done

rm -rf "${build_dir}"
