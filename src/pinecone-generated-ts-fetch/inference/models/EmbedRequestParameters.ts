/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Inference API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-10
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * Model-specific parameters.
 * @export
 * @interface EmbedRequestParameters
 */
export interface EmbedRequestParameters {
    /**
     * Common property used to distinguish between types of data.
     * @type {string}
     * @memberof EmbedRequestParameters
     */
    inputType?: string;
    /**
     * How to handle inputs longer than those supported by the model. If NONE, when the input exceeds the maximum input token length an error will be returned.
     * @type {string}
     * @memberof EmbedRequestParameters
     */
    truncate?: string;
}

/**
 * Check if a given object implements the EmbedRequestParameters interface.
 */
export function instanceOfEmbedRequestParameters(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function EmbedRequestParametersFromJSON(json: any): EmbedRequestParameters {
    return EmbedRequestParametersFromJSONTyped(json, false);
}

export function EmbedRequestParametersFromJSONTyped(json: any, ignoreDiscriminator: boolean): EmbedRequestParameters {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'inputType': !exists(json, 'input_type') ? undefined : json['input_type'],
        'truncate': !exists(json, 'truncate') ? undefined : json['truncate'],
    };
}

export function EmbedRequestParametersToJSON(value?: EmbedRequestParameters | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'input_type': value.inputType,
        'truncate': value.truncate,
    };
}

