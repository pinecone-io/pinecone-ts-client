/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Assistant Control Plane API
 * Pinecone Assistant Engine is a context engine to store and retrieve relevant knowledge  from millions of documents at scale. This API supports creating and managing assistants. 
 *
 * The version of the OpenAPI document: 2025-01
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * The configuration needed to create an assistant.
 * @export
 * @interface CreateAssistantRequest
 */
export interface CreateAssistantRequest {
    /**
     * The name of the assistant. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof CreateAssistantRequest
     */
    name: string;
    /**
     * Description or directive for the assistant to apply to all responses.
     * @type {string}
     * @memberof CreateAssistantRequest
     */
    instructions?: string | null;
    /**
     * 
     * @type {object}
     * @memberof CreateAssistantRequest
     */
    metadata?: object;
}

/**
 * Check if a given object implements the CreateAssistantRequest interface.
 */
export function instanceOfCreateAssistantRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;

    return isInstance;
}

export function CreateAssistantRequestFromJSON(json: any): CreateAssistantRequest {
    return CreateAssistantRequestFromJSONTyped(json, false);
}

export function CreateAssistantRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateAssistantRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'instructions': !exists(json, 'instructions') ? undefined : json['instructions'],
        'metadata': !exists(json, 'metadata') ? undefined : json['metadata'],
    };
}

export function CreateAssistantRequestToJSON(value?: CreateAssistantRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'instructions': value.instructions,
        'metadata': value.metadata,
    };
}

