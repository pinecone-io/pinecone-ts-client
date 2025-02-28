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
import type { SnippetModel } from './SnippetModel';
import {
    SnippetModelFromJSON,
    SnippetModelFromJSONTyped,
    SnippetModelToJSON,
} from './SnippetModel';
import type { UsageModel } from './UsageModel';
import {
    UsageModelFromJSON,
    UsageModelFromJSONTyped,
    UsageModelToJSON,
} from './UsageModel';

/**
 * The response format containing the context from an assistant.
 * @export
 * @interface ContextModel
 */
export interface ContextModel {
    /**
     * 
     * @type {string}
     * @memberof ContextModel
     */
    id?: string;
    /**
     * 
     * @type {Array<SnippetModel>}
     * @memberof ContextModel
     */
    snippets: Array<SnippetModel>;
    /**
     * 
     * @type {UsageModel}
     * @memberof ContextModel
     */
    usage: UsageModel;
}

/**
 * Check if a given object implements the ContextModel interface.
 */
export function instanceOfContextModel(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "snippets" in value;
    isInstance = isInstance && "usage" in value;

    return isInstance;
}

export function ContextModelFromJSON(json: any): ContextModel {
    return ContextModelFromJSONTyped(json, false);
}

export function ContextModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ContextModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'snippets': ((json['snippets'] as Array<any>).map(SnippetModelFromJSON)),
        'usage': UsageModelFromJSON(json['usage']),
    };
}

export function ContextModelToJSON(value?: ContextModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'snippets': ((value.snippets as Array<any>).map(SnippetModelToJSON)),
        'usage': UsageModelToJSON(value.usage),
    };
}

