/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Data Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge from millions of documents at scale. This API supports interactions with assistants.
 *
 * The version of the OpenAPI document: 2025-04
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * The HighlightModel represents a portion of a referenced document that directly supports or is relevant to the response.
 * @export
 * @interface HighlightModel
 */
export interface HighlightModel {
    /**
     * The type of the highlight. Currently it is always text.
     * @type {string}
     * @memberof HighlightModel
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof HighlightModel
     */
    content: string;
}

/**
 * Check if a given object implements the HighlightModel interface.
 */
export function instanceOfHighlightModel(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "type" in value;
    isInstance = isInstance && "content" in value;

    return isInstance;
}

export function HighlightModelFromJSON(json: any): HighlightModel {
    return HighlightModelFromJSONTyped(json, false);
}

export function HighlightModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): HighlightModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': json['type'],
        'content': json['content'],
    };
}

export function HighlightModelToJSON(value?: HighlightModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'content': value.content,
    };
}

