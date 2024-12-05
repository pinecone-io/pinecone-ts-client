/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: unstable
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * Configure the integrated inference embedding settings for this index.
 * 
 * You can convert an existing index to an integrated index by specifying the embedding model and field_map. The index vector type and dimension must match the model vector type and dimension, and the index similarity metric must be supported by the model. Refer to the [model guide](https://docs.pinecone.io/guides/inference/understanding-inference#embedding-models) for available models and model details.
 * 
 * You can later change the embedding configuration to update the field map, read parameters, or write parameters. Once set, the model cannot be changed.
 * @export
 * @interface ConfigureIndexRequestEmbed
 */
export interface ConfigureIndexRequestEmbed {
    /**
     * The name of the embedding model to use with the index. The index dimension and model dimension must match, and the index similarity metric must be supported by the model. The index embedding model cannot be changed once set.
     * @type {string}
     * @memberof ConfigureIndexRequestEmbed
     */
    model?: string;
    /**
     * Identifies the name of the text field from your document model that will be embedded.
     * @type {object}
     * @memberof ConfigureIndexRequestEmbed
     */
    fieldMap?: object;
    /**
     * The read parameters for the embedding model.
     * @type {object}
     * @memberof ConfigureIndexRequestEmbed
     */
    readParameters?: object;
    /**
     * The write parameters for the embedding model.
     * @type {object}
     * @memberof ConfigureIndexRequestEmbed
     */
    writeParameters?: object;
}

/**
 * Check if a given object implements the ConfigureIndexRequestEmbed interface.
 */
export function instanceOfConfigureIndexRequestEmbed(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ConfigureIndexRequestEmbedFromJSON(json: any): ConfigureIndexRequestEmbed {
    return ConfigureIndexRequestEmbedFromJSONTyped(json, false);
}

export function ConfigureIndexRequestEmbedFromJSONTyped(json: any, ignoreDiscriminator: boolean): ConfigureIndexRequestEmbed {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'model': !exists(json, 'model') ? undefined : json['model'],
        'fieldMap': !exists(json, 'field_map') ? undefined : json['field_map'],
        'readParameters': !exists(json, 'read_parameters') ? undefined : json['read_parameters'],
        'writeParameters': !exists(json, 'write_parameters') ? undefined : json['write_parameters'],
    };
}

export function ConfigureIndexRequestEmbedToJSON(value?: ConfigureIndexRequestEmbed | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'model': value.model,
        'field_map': value.fieldMap,
        'read_parameters': value.readParameters,
        'write_parameters': value.writeParameters,
    };
}

