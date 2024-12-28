/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Data Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge from millions of documents at scale. This API supports interactions with assistants.
 *
 * The version of the OpenAPI document: 2025-01
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ReferenceModel } from './ReferenceModel';
import {
    ReferenceModelFromJSON,
    ReferenceModelFromJSONTyped,
    ReferenceModelToJSON,
} from './ReferenceModel';

/**
 * The CitationModel describes a single cited source returned by a chat request.
 * @export
 * @interface CitationModel
 */
export interface CitationModel {
    /**
     * The index position of the citation in the complete text response.
     * @type {number}
     * @memberof CitationModel
     */
    position?: number;
    /**
     * 
     * @type {Array<ReferenceModel>}
     * @memberof CitationModel
     */
    references?: Array<ReferenceModel>;
}

/**
 * Check if a given object implements the CitationModel interface.
 */
export function instanceOfCitationModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CitationModelFromJSON(json: any): CitationModel {
    return CitationModelFromJSONTyped(json, false);
}

export function CitationModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): CitationModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'position': !exists(json, 'position') ? undefined : json['position'],
        'references': !exists(json, 'references') ? undefined : ((json['references'] as Array<any>).map(ReferenceModelFromJSON)),
    };
}

export function CitationModelToJSON(value?: CitationModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'position': value.position,
        'references': value.references === undefined ? undefined : ((value.references as Array<any>).map(ReferenceModelToJSON)),
    };
}
