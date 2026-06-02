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
		--additional-properties=supportsES6=true,useSingleRequestParameter=true

	rm -rf "${destination}/${module_name}"
	mkdir -p "${destination}/${module_name}"
	cp -r ${build_dir}/* "${destination}/${module_name}"

	echo "export const X_PINECONE_API_VERSION = '${version}';" > ${destination}/${module_name}/api_version.ts
	echo "export * from './api_version';" >> ${destination}/${module_name}/index.ts
}

fix_id_field() {
	local file=$1
	sed -i '' \
		-e 's/id:/_id:/g' \
		-e "s/'id'/'_id'/g" \
		-e 's/"id"/"_id"/g' \
		-e 's/\.id/\._id/g' \
		"$file"
}

fix_score_field() {
	local file=$1
	sed -i '' \
		-e 's/score:/_score:/g' \
		-e "s/'score'/'_score'/g" \
		-e 's/"score"/"_score"/g' \
		-e 's/\.score/\._score/g' \
		"$file"
}

# The generator strips leading underscores from property names (e.g. _id -> id,
# _score -> score). These sed fixups restore the original names to match the spec.
clean_oas_underscore_manipulation() {
	local models_dir="${destination}/db_data/models"

	for file in Hit.ts DocumentSearchMatch.ts; do
		fix_id_field "${models_dir}/${file}"
		fix_score_field "${models_dir}/${file}"
	done

	for file in UpsertRecord.ts DocumentRecord.ts FetchedDocumentRecord.ts; do
		fix_id_field "${models_dir}/${file}"
	done
}

update_apis_repo

rm -rf "${destination}"
mkdir -p "${destination}"

for module in "${modules[@]}"; do
	generate_client $module
	sleep 1
done

clean_oas_underscore_manipulation

rm -rf "${build_dir}"
