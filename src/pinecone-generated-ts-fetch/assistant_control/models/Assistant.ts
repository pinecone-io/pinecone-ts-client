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
 * The AssistantModel describes the configuration and status of a Pinecone Assistant.
 * @export
 * @interface Assistant
 */
export interface Assistant {
    /**
     * The name of the assistant. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof Assistant
     */
    name: string;
    /**
     * Description or directive for the assistant to apply to all responses.
     * @type {string}
     * @memberof Assistant
     */
    instructions?: string | null;
    /**
     * 
     * @type {object}
     * @memberof Assistant
     */
    metadata?: object | null;
    /**
     * 
     * @type {string}
     * @memberof Assistant
     */
    status: AssistantStatusEnum;
    /**
     * The host where the assistant is deployed.
     * @type {string}
     * @memberof Assistant
     */
    host?: string;
    /**
     * 
     * @type {Date}
     * @memberof Assistant
     */
    createdAt?: Date;
    /**
     * 
     * @type {Date}
     * @memberof Assistant
     */
    updatedAt?: Date;
}


/**
 * @export
 */
export const AssistantStatusEnum = {
    Initializing: 'Initializing',
    Failed: 'Failed',
    Ready: 'Ready',
    Terminating: 'Terminating'
} as const;
export type AssistantStatusEnum = typeof AssistantStatusEnum[keyof typeof AssistantStatusEnum];


/**
 * Check if a given object implements the Assistant interface.
 */
export function instanceOfAssistant(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "status" in value;

    return isInstance;
}

export function AssistantFromJSON(json: any): Assistant {
    return AssistantFromJSONTyped(json, false);
}

export function AssistantFromJSONTyped(json: any, ignoreDiscriminator: boolean): Assistant {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'instructions': !exists(json, 'instructions') ? undefined : json['instructions'],
        'metadata': !exists(json, 'metadata') ? undefined : json['metadata'],
        'status': json['status'],
        'host': !exists(json, 'host') ? undefined : json['host'],
        'createdAt': !exists(json, 'created_at') ? undefined : (new Date(json['created_at'])),
        'updatedAt': !exists(json, 'updated_at') ? undefined : (new Date(json['updated_at'])),
    };
}

export function AssistantToJSON(value?: Assistant | null): any {
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
        'status': value.status,
        'host': value.host,
        'created_at': value.createdAt === undefined ? undefined : (value.createdAt.toISOString()),
        'updated_at': value.updatedAt === undefined ? undefined : (value.updatedAt.toISOString()),
    };
}

