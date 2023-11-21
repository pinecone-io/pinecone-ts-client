/* tslint:disable */
/* eslint-disable */
/**
 * Pineonce.io Public API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  DeleteRequest,
  DescribeIndexStatsRequest,
  DescribeIndexStatsResponse,
  FetchResponse,
  QueryRequest,
  QueryResponse,
  RpcStatus,
  UpdateRequest,
  UpsertRequest,
  UpsertResponse,
} from '../models/index';
import {
    DeleteRequestFromJSON,
    DeleteRequestToJSON,
    DescribeIndexStatsRequestFromJSON,
    DescribeIndexStatsRequestToJSON,
    DescribeIndexStatsResponseFromJSON,
    DescribeIndexStatsResponseToJSON,
    FetchResponseFromJSON,
    FetchResponseToJSON,
    QueryRequestFromJSON,
    QueryRequestToJSON,
    QueryResponseFromJSON,
    QueryResponseToJSON,
    RpcStatusFromJSON,
    RpcStatusToJSON,
    UpdateRequestFromJSON,
    UpdateRequestToJSON,
    UpsertRequestFromJSON,
    UpsertRequestToJSON,
    UpsertResponseFromJSON,
    UpsertResponseToJSON,
} from '../models/index';

export interface DeleteOperationRequest {
    deleteRequest: DeleteRequest;
}

export interface Delete1Request {
    ids?: Array<string>;
    deleteAll?: boolean;
    namespace?: string;
}

export interface DescribeIndexStatsOperationRequest {
    describeIndexStatsRequest: DescribeIndexStatsRequest;
}

export interface FetchRequest {
    ids: Array<string>;
    namespace?: string;
}

export interface QueryOperationRequest {
    queryRequest: QueryRequest;
}

export interface UpdateOperationRequest {
    updateRequest: UpdateRequest;
}

export interface UpsertOperationRequest {
    upsertRequest: UpsertRequest;
}

/**
 * 
 */
export class VectorOperationsApi extends runtime.BaseAPI {

    /**
     * The `Delete` operation deletes vectors, by id, from a single namespace. You can delete items by their id, from a single namespace.
     * Delete
     */
    async _deleteRaw(requestParameters: DeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<object>> {
        if (requestParameters.deleteRequest === null || requestParameters.deleteRequest === undefined) {
            throw new runtime.RequiredError('deleteRequest','Required parameter requestParameters.deleteRequest was null or undefined when calling _delete.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/vectors/delete`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: DeleteRequestToJSON(requestParameters.deleteRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse<any>(response);
    }

    /**
     * The `Delete` operation deletes vectors, by id, from a single namespace. You can delete items by their id, from a single namespace.
     * Delete
     */
    async _delete(requestParameters: DeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<object> {
        const response = await this._deleteRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `Delete` operation deletes vectors, by id, from a single namespace. You can delete items by their id, from a single namespace.
     * Delete
     */
    async delete1Raw(requestParameters: Delete1Request, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<object>> {
        const queryParameters: any = {};

        if (requestParameters.ids) {
            queryParameters['ids'] = requestParameters.ids;
        }

        if (requestParameters.deleteAll !== undefined) {
            queryParameters['deleteAll'] = requestParameters.deleteAll;
        }

        if (requestParameters.namespace !== undefined) {
            queryParameters['namespace'] = requestParameters.namespace;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/vectors/delete`,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse<any>(response);
    }

    /**
     * The `Delete` operation deletes vectors, by id, from a single namespace. You can delete items by their id, from a single namespace.
     * Delete
     */
    async delete1(requestParameters: Delete1Request = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<object> {
        const response = await this.delete1Raw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `DescribeIndexStats` operation returns statistics about the index\'s contents, including the vector count per namespace, the number of dimensions, and the index fullness. The index fullness result  may be inaccurate during pod resizing; to get the status of a pod resizing process, use [`describe_index`](https://www.pinecone.io/docs/api/operation/describe_index/).
     * DescribeIndexStats
     */
    async describeIndexStatsRaw(requestParameters: DescribeIndexStatsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DescribeIndexStatsResponse>> {
        if (requestParameters.describeIndexStatsRequest === null || requestParameters.describeIndexStatsRequest === undefined) {
            throw new runtime.RequiredError('describeIndexStatsRequest','Required parameter requestParameters.describeIndexStatsRequest was null or undefined when calling describeIndexStats.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/describe_index_stats`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: DescribeIndexStatsRequestToJSON(requestParameters.describeIndexStatsRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DescribeIndexStatsResponseFromJSON(jsonValue));
    }

    /**
     * The `DescribeIndexStats` operation returns statistics about the index\'s contents, including the vector count per namespace, the number of dimensions, and the index fullness. The index fullness result  may be inaccurate during pod resizing; to get the status of a pod resizing process, use [`describe_index`](https://www.pinecone.io/docs/api/operation/describe_index/).
     * DescribeIndexStats
     */
    async describeIndexStats(requestParameters: DescribeIndexStatsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DescribeIndexStatsResponse> {
        const response = await this.describeIndexStatsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `DescribeIndexStats` operation returns statistics about the index\'s contents, including the vector count per namespace, the number of dimensions, and the index fullness. The index fullness result  may be inaccurate during pod resizing; to get the status of a pod resizing process, use [`describe_index`](https://www.pinecone.io/docs/api/operation/describe_index/).
     * DescribeIndexStats
     */
    async describeIndexStats1Raw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DescribeIndexStatsResponse>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/describe_index_stats`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DescribeIndexStatsResponseFromJSON(jsonValue));
    }

    /**
     * The `DescribeIndexStats` operation returns statistics about the index\'s contents, including the vector count per namespace, the number of dimensions, and the index fullness. The index fullness result  may be inaccurate during pod resizing; to get the status of a pod resizing process, use [`describe_index`](https://www.pinecone.io/docs/api/operation/describe_index/).
     * DescribeIndexStats
     */
    async describeIndexStats1(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DescribeIndexStatsResponse> {
        const response = await this.describeIndexStats1Raw(initOverrides);
        return await response.value();
    }

    /**
     * The `Fetch` operation looks up and returns vectors, by ID, from a single namespace. The returned vectors include the vector data and/or metadata.
     * Fetch
     */
    async fetchRaw(requestParameters: FetchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<FetchResponse>> {
        if (requestParameters.ids === null || requestParameters.ids === undefined) {
            throw new runtime.RequiredError('ids','Required parameter requestParameters.ids was null or undefined when calling fetch.');
        }

        const queryParameters: any = {};

        if (requestParameters.ids) {
            queryParameters['ids'] = requestParameters.ids;
        }

        if (requestParameters.namespace !== undefined) {
            queryParameters['namespace'] = requestParameters.namespace;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/vectors/fetch`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => FetchResponseFromJSON(jsonValue));
    }

    /**
     * The `Fetch` operation looks up and returns vectors, by ID, from a single namespace. The returned vectors include the vector data and/or metadata.
     * Fetch
     */
    async fetch(requestParameters: FetchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<FetchResponse> {
        const response = await this.fetchRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `Query` operation searches a namespace, using a query vector. It retrieves the ids of the most similar items in a namespace, along with their similarity scores.
     * Query
     */
    async queryRaw(requestParameters: QueryOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<QueryResponse>> {
        if (requestParameters.queryRequest === null || requestParameters.queryRequest === undefined) {
            throw new runtime.RequiredError('queryRequest','Required parameter requestParameters.queryRequest was null or undefined when calling query.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/query`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: QueryRequestToJSON(requestParameters.queryRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => QueryResponseFromJSON(jsonValue));
    }

    /**
     * The `Query` operation searches a namespace, using a query vector. It retrieves the ids of the most similar items in a namespace, along with their similarity scores.
     * Query
     */
    async query(requestParameters: QueryOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<QueryResponse> {
        const response = await this.queryRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `Update` operation updates vector in a namespace. If a value is included, it will overwrite the previous value. If a set_metadata is included, the values of the fields specified in it will be added or overwrite the previous value.
     * Update
     */
    async updateRaw(requestParameters: UpdateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<object>> {
        if (requestParameters.updateRequest === null || requestParameters.updateRequest === undefined) {
            throw new runtime.RequiredError('updateRequest','Required parameter requestParameters.updateRequest was null or undefined when calling update.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/vectors/update`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: UpdateRequestToJSON(requestParameters.updateRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse<any>(response);
    }

    /**
     * The `Update` operation updates vector in a namespace. If a value is included, it will overwrite the previous value. If a set_metadata is included, the values of the fields specified in it will be added or overwrite the previous value.
     * Update
     */
    async update(requestParameters: UpdateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<object> {
        const response = await this.updateRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `Upsert` operation writes vectors into a namespace. If a new value is upserted for an existing vector id, it will overwrite the previous value.
     * Upsert
     */
    async upsertRaw(requestParameters: UpsertOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UpsertResponse>> {
        if (requestParameters.upsertRequest === null || requestParameters.upsertRequest === undefined) {
            throw new runtime.RequiredError('upsertRequest','Required parameter requestParameters.upsertRequest was null or undefined when calling upsert.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/vectors/upsert`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: UpsertRequestToJSON(requestParameters.upsertRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UpsertResponseFromJSON(jsonValue));
    }

    /**
     * The `Upsert` operation writes vectors into a namespace. If a new value is upserted for an existing vector id, it will overwrite the previous value.
     * Upsert
     */
    async upsert(requestParameters: UpsertOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UpsertResponse> {
        const response = await this.upsertRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
