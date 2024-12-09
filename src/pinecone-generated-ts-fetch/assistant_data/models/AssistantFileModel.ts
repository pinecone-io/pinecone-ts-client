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
/**
 * AssistantFileModel is the response format to a successful file upload request.
 * @export
 * @interface AssistantFileModel
 */
export interface AssistantFileModel {
    /**
     * 
     * @type {string}
     * @memberof AssistantFileModel
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof AssistantFileModel
     */
    id: string;
    /**
     * 
     * @type {object}
     * @memberof AssistantFileModel
     */
    metadata?: object | null;
    /**
     * 
     * @type {string}
     * @memberof AssistantFileModel
     */
    createdOn?: string;
    /**
     * 
     * @type {string}
     * @memberof AssistantFileModel
     */
    updatedOn?: string;
    /**
     * 
     * @type {string}
     * @memberof AssistantFileModel
     */
    status?: AssistantFileModelStatusEnum;
    /**
     * The percentage of the file that has been processed
     * @type {number}
     * @memberof AssistantFileModel
     */
    percentDone?: number | null;
    /**
     * A signed url that gives you access to the underlying file
     * @type {string}
     * @memberof AssistantFileModel
     */
    signedUrl?: string | null;
    /**
     * A message describing any error during file processing, provided only if an error occurs.
     * @type {string}
     * @memberof AssistantFileModel
     */
    errorMessage?: string | null;
}


/**
 * @export
 */
export const AssistantFileModelStatusEnum = {
    Processing: 'Processing',
    Available: 'Available',
    Deleting: 'Deleting',
    ProcessingFailed: 'ProcessingFailed'
} as const;
export type AssistantFileModelStatusEnum = typeof AssistantFileModelStatusEnum[keyof typeof AssistantFileModelStatusEnum];


/**
 * Check if a given object implements the AssistantFileModel interface.
 */
export function instanceOfAssistantFileModel(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "id" in value;

    return isInstance;
}

export function AssistantFileModelFromJSON(json: any): AssistantFileModel {
    return AssistantFileModelFromJSONTyped(json, false);
}

export function AssistantFileModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): AssistantFileModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'id': json['id'],
        'metadata': !exists(json, 'metadata') ? undefined : json['metadata'],
        'createdOn': !exists(json, 'created_on') ? undefined : json['created_on'],
        'updatedOn': !exists(json, 'updated_on') ? undefined : json['updated_on'],
        'status': !exists(json, 'status') ? undefined : json['status'],
        'percentDone': !exists(json, 'percent_done') ? undefined : json['percent_done'],
        'signedUrl': !exists(json, 'signed_url') ? undefined : json['signed_url'],
        'errorMessage': !exists(json, 'error_message') ? undefined : json['error_message'],
    };
}

export function AssistantFileModelToJSON(value?: AssistantFileModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'id': value.id,
        'metadata': value.metadata,
        'created_on': value.createdOn,
        'updated_on': value.updatedOn,
        'status': value.status,
        'percent_done': value.percentDone,
        'signed_url': value.signedUrl,
        'error_message': value.errorMessage,
    };
}

