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
 * The ChoiceModel describes a single choice in a chat completion response
 * @export
 * @interface ChoiceModel
 */
export interface ChoiceModel {
    /**
     * 
     * @type {string}
     * @memberof ChoiceModel
     */
    finishReason?: ChoiceModelFinishReasonEnum;
    /**
     * 
     * @type {number}
     * @memberof ChoiceModel
     */
    index?: number;
    /**
     * 
     * @type {MessageModel}
     * @memberof ChoiceModel
     */
    message?: MessageModel;
}


/**
 * @export
 */
export const ChoiceModelFinishReasonEnum = {
    Stop: 'stop',
    Length: 'length',
    ContentFilter: 'content_filter',
    FunctionCall: 'function_call'
} as const;
export type ChoiceModelFinishReasonEnum = typeof ChoiceModelFinishReasonEnum[keyof typeof ChoiceModelFinishReasonEnum];


/**
 * Check if a given object implements the ChoiceModel interface.
 */
export function instanceOfChoiceModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ChoiceModelFromJSON(json: any): ChoiceModel {
    return ChoiceModelFromJSONTyped(json, false);
}

export function ChoiceModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChoiceModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'finishReason': !exists(json, 'finish_reason') ? undefined : json['finish_reason'],
        'index': !exists(json, 'index') ? undefined : json['index'],
        'message': !exists(json, 'message') ? undefined : MessageModelFromJSON(json['message']),
    };
}

export function ChoiceModelToJSON(value?: ChoiceModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'finish_reason': value.finishReason,
        'index': value.index,
        'message': MessageModelToJSON(value.message),
    };
}

