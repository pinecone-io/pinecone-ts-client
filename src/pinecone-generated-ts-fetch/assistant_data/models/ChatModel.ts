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
import type { CitationModel } from './CitationModel';
import {
    CitationModelFromJSON,
    CitationModelFromJSONTyped,
    CitationModelToJSON,
} from './CitationModel';
import type { MessageModel } from './MessageModel';
import {
    MessageModelFromJSON,
    MessageModelFromJSONTyped,
    MessageModelToJSON,
} from './MessageModel';
import type { UsageModel } from './UsageModel';
import {
    UsageModelFromJSON,
    UsageModelFromJSONTyped,
    UsageModelToJSON,
} from './UsageModel';

/**
 * The ChatCompletionCitationModel describes the response format of a chat request from the citation api
 * @export
 * @interface ChatModel
 */
export interface ChatModel {
    /**
     * 
     * @type {string}
     * @memberof ChatModel
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof ChatModel
     */
    finishReason?: ChatModelFinishReasonEnum;
    /**
     * 
     * @type {MessageModel}
     * @memberof ChatModel
     */
    message?: MessageModel;
    /**
     * 
     * @type {string}
     * @memberof ChatModel
     */
    model?: string;
    /**
     * 
     * @type {Array<CitationModel>}
     * @memberof ChatModel
     */
    citations?: Array<CitationModel>;
    /**
     * 
     * @type {UsageModel}
     * @memberof ChatModel
     */
    usage?: UsageModel;
}


/**
 * @export
 */
export const ChatModelFinishReasonEnum = {
    Stop: 'stop',
    Length: 'length',
    ContentFilter: 'content_filter',
    FunctionCall: 'function_call'
} as const;
export type ChatModelFinishReasonEnum = typeof ChatModelFinishReasonEnum[keyof typeof ChatModelFinishReasonEnum];


/**
 * Check if a given object implements the ChatModel interface.
 */
export function instanceOfChatModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ChatModelFromJSON(json: any): ChatModel {
    return ChatModelFromJSONTyped(json, false);
}

export function ChatModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChatModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'finishReason': !exists(json, 'finish_reason') ? undefined : json['finish_reason'],
        'message': !exists(json, 'message') ? undefined : MessageModelFromJSON(json['message']),
        'model': !exists(json, 'model') ? undefined : json['model'],
        'citations': !exists(json, 'citations') ? undefined : ((json['citations'] as Array<any>).map(CitationModelFromJSON)),
        'usage': !exists(json, 'usage') ? undefined : UsageModelFromJSON(json['usage']),
    };
}

export function ChatModelToJSON(value?: ChatModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'finish_reason': value.finishReason,
        'message': MessageModelToJSON(value.message),
        'model': value.model,
        'citations': value.citations === undefined ? undefined : ((value.citations as Array<any>).map(CitationModelToJSON)),
        'usage': UsageModelToJSON(value.usage),
    };
}

