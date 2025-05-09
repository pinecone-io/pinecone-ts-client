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
 * Chat completion message
 * @export
 * @interface ChatCompletionAssistant200ResponseChoicesInnerDelta
 */
export interface ChatCompletionAssistant200ResponseChoicesInnerDelta {
    /**
     * 
     * @type {string}
     * @memberof ChatCompletionAssistant200ResponseChoicesInnerDelta
     */
    role?: string;
    /**
     * 
     * @type {string}
     * @memberof ChatCompletionAssistant200ResponseChoicesInnerDelta
     */
    content?: string;
}

/**
 * Check if a given object implements the ChatCompletionAssistant200ResponseChoicesInnerDelta interface.
 */
export function instanceOfChatCompletionAssistant200ResponseChoicesInnerDelta(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ChatCompletionAssistant200ResponseChoicesInnerDeltaFromJSON(json: any): ChatCompletionAssistant200ResponseChoicesInnerDelta {
    return ChatCompletionAssistant200ResponseChoicesInnerDeltaFromJSONTyped(json, false);
}

export function ChatCompletionAssistant200ResponseChoicesInnerDeltaFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChatCompletionAssistant200ResponseChoicesInnerDelta {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'role': !exists(json, 'role') ? undefined : json['role'],
        'content': !exists(json, 'content') ? undefined : json['content'],
    };
}

export function ChatCompletionAssistant200ResponseChoicesInnerDeltaToJSON(value?: ChatCompletionAssistant200ResponseChoicesInnerDelta | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'role': value.role,
        'content': value.content,
    };
}

