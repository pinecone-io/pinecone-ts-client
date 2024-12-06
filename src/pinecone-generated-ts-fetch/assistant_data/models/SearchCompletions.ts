/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone AssistantCtrlPlane Engine API
 * Pinecone AssistantCtrlPlane Engine is a context engine to store and retrieve relevant knowledge from millions of documents at scale. This API supports interactions with assistants.
 *
 * The version of the OpenAPI document: v1alpha
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { MessageModel } from './MessageModel';
import {
    MessageModelFromJSON,
    MessageModelFromJSONTyped,
    MessageModelToJSON,
} from './MessageModel';

/**
 * The list of queries / chat's to chat an assistant
 * @export
 * @interface SearchCompletions
 */
export interface SearchCompletions {
    /**
     * 
     * @type {Array<MessageModel>}
     * @memberof SearchCompletions
     */
    messages: Array<MessageModel>;
    /**
     * If false, the assistant will return a single JSON response. If true, the assistant will return a stream of responses.
     * @type {boolean}
     * @memberof SearchCompletions
     */
    stream?: boolean;
    /**
     * The large language model to use for answer generation
     * @type {string}
     * @memberof SearchCompletions
     */
    model?: SearchCompletionsModelEnum;
    /**
     * Optionally filter which documents can be used in this query.
     * @type {object}
     * @memberof SearchCompletions
     */
    filter?: object;
}


/**
 * @export
 */
export const SearchCompletionsModelEnum = {
    Gpt4o: 'gpt-4o',
    Claude35Sonnet: 'claude-3-5-sonnet'
} as const;
export type SearchCompletionsModelEnum = typeof SearchCompletionsModelEnum[keyof typeof SearchCompletionsModelEnum];


/**
 * Check if a given object implements the SearchCompletions interface.
 */
export function instanceOfSearchCompletions(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "messages" in value;

    return isInstance;
}

export function SearchCompletionsFromJSON(json: any): SearchCompletions {
    return SearchCompletionsFromJSONTyped(json, false);
}

export function SearchCompletionsFromJSONTyped(json: any, ignoreDiscriminator: boolean): SearchCompletions {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'messages': ((json['messages'] as Array<any>).map(MessageModelFromJSON)),
        'stream': !exists(json, 'stream') ? undefined : json['stream'],
        'model': !exists(json, 'model') ? undefined : json['model'],
        'filter': !exists(json, 'filter') ? undefined : json['filter'],
    };
}

export function SearchCompletionsToJSON(value?: SearchCompletions | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'messages': ((value.messages as Array<any>).map(MessageModelToJSON)),
        'stream': value.stream,
        'model': value.model,
        'filter': value.filter,
    };
}

