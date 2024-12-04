/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Engine API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge from millions of documents at scale. This API supports interactions with assistants.
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
 * @interface Chat
 */
export interface Chat {
    /**
     * 
     * @type {Array<MessageModel>}
     * @memberof Chat
     */
    messages: Array<MessageModel>;
    /**
     * If false, the assistant will return a single JSON response. If true, the assistant will return a stream of responses.
     * @type {boolean}
     * @memberof Chat
     */
    stream?: boolean;
    /**
     * The large language model to use for answer generation
     * @type {string}
     * @memberof Chat
     */
    model?: ChatModelEnum;
    /**
     * Optionally filter which documents can be used in this query.
     * @type {object}
     * @memberof Chat
     */
    filter?: object;
}


/**
 * @export
 */
export const ChatModelEnum = {
    Gpt4o: 'gpt-4o',
    Claude35Sonnet: 'claude-3-5-sonnet'
} as const;
export type ChatModelEnum = typeof ChatModelEnum[keyof typeof ChatModelEnum];


/**
 * Check if a given object implements the Chat interface.
 */
export function instanceOfChat(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "messages" in value;

    return isInstance;
}

export function ChatFromJSON(json: any): Chat {
    return ChatFromJSONTyped(json, false);
}

export function ChatFromJSONTyped(json: any, ignoreDiscriminator: boolean): Chat {
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

export function ChatToJSON(value?: Chat | null): any {
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

