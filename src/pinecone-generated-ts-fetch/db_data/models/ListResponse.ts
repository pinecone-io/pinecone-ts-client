/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-10
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ListItem } from './ListItem';
import {
    ListItemFromJSON,
    ListItemFromJSONTyped,
    ListItemToJSON,
} from './ListItem';
import type { Pagination } from './Pagination';
import {
    PaginationFromJSON,
    PaginationFromJSONTyped,
    PaginationToJSON,
} from './Pagination';
import type { Usage } from './Usage';
import {
    UsageFromJSON,
    UsageFromJSONTyped,
    UsageToJSON,
} from './Usage';

/**
 * The response for the `List` operation.
 * @export
 * @interface ListResponse
 */
export interface ListResponse {
    /**
     * 
     * @type {Array<ListItem>}
     * @memberof ListResponse
     */
    vectors?: Array<ListItem>;
    /**
     * 
     * @type {Pagination}
     * @memberof ListResponse
     */
    pagination?: Pagination;
    /**
     * The namespace of the vectors.
     * @type {string}
     * @memberof ListResponse
     */
    namespace?: string;
    /**
     * 
     * @type {Usage}
     * @memberof ListResponse
     */
    usage?: Usage;
}

/**
 * Check if a given object implements the ListResponse interface.
 */
export function instanceOfListResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ListResponseFromJSON(json: any): ListResponse {
    return ListResponseFromJSONTyped(json, false);
}

export function ListResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ListResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'vectors': !exists(json, 'vectors') ? undefined : ((json['vectors'] as Array<any>).map(ListItemFromJSON)),
        'pagination': !exists(json, 'pagination') ? undefined : PaginationFromJSON(json['pagination']),
        'namespace': !exists(json, 'namespace') ? undefined : json['namespace'],
        'usage': !exists(json, 'usage') ? undefined : UsageFromJSON(json['usage']),
    };
}

export function ListResponseToJSON(value?: ListResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'vectors': value.vectors === undefined ? undefined : ((value.vectors as Array<any>).map(ListItemToJSON)),
        'pagination': PaginationToJSON(value.pagination),
        'namespace': value.namespace,
        'usage': UsageToJSON(value.usage),
    };
}

