#!/bin/bash

set -eux -o pipefail

version=$1 # e.g. 2024-07
modules=("db_control" "db_data" "inference" "assistant_control" "assistant_data" "assistant_evaluation" "admin")

destination="src/pinecone-generated-ts-fetch"
build_dir="build"

update_apis_repo() {
	echo "Updating apis repo"
	pushd codegen/apis
		git fetch
		git checkout main
		git pull
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

# BSD sed (macOS) requires an explicit empty string for in-place edits; GNU sed does not.
if [[ "$(uname -s)" == "Darwin" ]]; then
	sedi() { sed -i '' "$@"; }
else
	sedi() { sed -i "$@"; }
fi

# Generated TypeScript code attempts to internally map OpenAPI fields that begin
# with "_" to a non-underscored alternative. Along with a polymorphic object,
# this causes collisions and headaches. We massage the generated models to
# maintain the original field names from the OpenAPI spec and circumvent
# the remapping behavior as this is simpler for now than creating a fully
# custom java generator class.
#
# The `\([^a-zA-Z0-9_]\)` guards keep these substitutions from matching inside
# longer identifiers (e.g. `backup_id:`, `.sourceIndexId`), and make them
# idempotent so re-running against already-patched files is a no-op.
fix_id_field() {
	local file=$1
	sedi \
		-e 's/\([^a-zA-Z0-9_]\)id:/\1_id:/g' \
		-e 's/^id:/_id:/' \
		-e "s/'id'/'_id'/g" \
		-e 's/"id"/"_id"/g' \
		-e 's/\.id\([^a-zA-Z0-9_]\)/\._id\1/g' \
		-e 's/\.id$/\._id/' \
		"$file"
}

fix_score_field() {
	local file=$1
	sedi \
		-e 's/\([^a-zA-Z0-9_]\)score:/\1_score:/g' \
		-e 's/^score:/_score:/' \
		-e "s/'score'/'_score'/g" \
		-e 's/"score"/"_score"/g' \
		-e 's/\.score\([^a-zA-Z0-9_]\)/\._score\1/g' \
		-e 's/\.score$/\._score/' \
		"$file"
}

# The generator also camel-cases the spec's `_remove_fields` property to
# `removeFields` (stripping the leading underscore). Restore the original
# name so the property is not duplicated in the request body by the `...value`
# spread in the model's ToJSON. The `[?]*` group preserves an optional marker
# on the property declaration.
fix_remove_fields_field() {
	local file=$1
	sedi \
		-e 's/\([^a-zA-Z0-9_]\)removeFields\([?]*\):/\1_remove_fields\2:/g' \
		-e 's/^removeFields\([?]*\):/_remove_fields\1:/' \
		-e "s/'removeFields'/'_remove_fields'/g" \
		-e 's/"removeFields"/"_remove_fields"/g' \
		-e 's/\.removeFields\([^a-zA-Z0-9_]\)/\._remove_fields\1/g' \
		-e 's/\.removeFields$/\._remove_fields/' \
		"$file"
}

# Models are skipped when absent so that regenerating older spec versions
# (which predate the document operations) does not fail under `set -e`.
clean_oas_underscore_manipulation() {
	local models_dir="${destination}/db_data/models"

	for file in Hit.ts DocumentSearchMatch.ts; do
		[ -f "${models_dir}/${file}" ] || continue
		fix_id_field "${models_dir}/${file}"
		fix_score_field "${models_dir}/${file}"
	done

	for file in UpsertRecord.ts DocumentRecord.ts FetchedDocumentRecord.ts UpdateDocumentRecord.ts ListedDocumentRecord.ts; do
		[ -f "${models_dir}/${file}" ] || continue
		fix_id_field "${models_dir}/${file}"
	done

	if [ -f "${models_dir}/UpdateDocumentRecord.ts" ]; then
		fix_remove_fields_field "${models_dir}/UpdateDocumentRecord.ts"
	fi
}

# IndexSchemaField is spec'd as anyOf: [TypedIndexSchemaField, LegacyMetadataField].
# The generator can't model this correctly: it collapses the anyOf into a concrete
# interface matching only LegacyMetadataField's shape, which silently drops every
# other property (type, dimension, metric, model, fullTextSearch) at deserialization
# time. Rewrite the file to express the union properly and dispatch on the presence
# of `type` at runtime.
fix_index_schema_field_legacy() {
	local file="${destination}/db_control/models/IndexSchemaField.ts"
	[ -f "$file" ] || return 0
	cat > "$file" << TYPESCRIPT
/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: ${version}
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import type { LegacyMetadataField } from './LegacyMetadataField';
import {
    LegacyMetadataFieldFromJSONTyped,
    LegacyMetadataFieldToJSON,
} from './LegacyMetadataField';
import type { TypedIndexSchemaField } from './TypedIndexSchemaField';
import {
    TypedIndexSchemaFieldFromJSONTyped,
    TypedIndexSchemaFieldToJSON,
} from './TypedIndexSchemaField';

/**
 * @type IndexSchemaField
 * The configuration of a single field in the index schema.
 * Typed fields (all current field types) carry a \`type\` discriminator property.
 * Legacy fields from indexes created before typed schemas were introduced carry
 * no \`type\` property and are represented as {@link LegacyMetadataField}.
 * @export
 */
export type IndexSchemaField = TypedIndexSchemaField | LegacyMetadataField;

export function IndexSchemaFieldFromJSON(json: any): IndexSchemaField {
    return IndexSchemaFieldFromJSONTyped(json, false);
}

export function IndexSchemaFieldFromJSONTyped(json: any, ignoreDiscriminator: boolean): IndexSchemaField {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    if ('type' in json) {
        return TypedIndexSchemaFieldFromJSONTyped(json, ignoreDiscriminator);
    }
    return LegacyMetadataFieldFromJSONTyped(json, ignoreDiscriminator);
}

export function IndexSchemaFieldToJSON(value?: IndexSchemaField | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if ('type' in value) {
        return TypedIndexSchemaFieldToJSON(value as TypedIndexSchemaField);
    }
    return LegacyMetadataFieldToJSON(value as LegacyMetadataField);
}
TYPESCRIPT
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
fix_index_schema_field_legacy
