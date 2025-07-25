/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2025-04
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  ListNamespacesResponse,
  NamespaceDescription,
  RpcStatus,
} from '../models/index';
import {
    ListNamespacesResponseFromJSON,
    ListNamespacesResponseToJSON,
    NamespaceDescriptionFromJSON,
    NamespaceDescriptionToJSON,
    RpcStatusFromJSON,
    RpcStatusToJSON,
} from '../models/index';

export interface DeleteNamespaceRequest {
    namespace: string;
}

export interface DescribeNamespaceRequest {
    namespace: string;
}

export interface ListNamespacesOperationRequest {
    limit?: number;
    paginationToken?: string;
}

/**
 * 
 */
export class NamespaceOperationsApi extends runtime.BaseAPI {

    /**
     * Delete a namespace from a serverless index. Deleting a namespace is irreversible; all data in the namespace is permanently deleted.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * Delete a namespace
     */
    async deleteNamespaceRaw(requestParameters: DeleteNamespaceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<object>> {
        if (requestParameters.namespace === null || requestParameters.namespace === undefined) {
            throw new runtime.RequiredError('namespace','Required parameter requestParameters.namespace was null or undefined when calling deleteNamespace.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/namespaces/{namespace}`.replace(`{${"namespace"}}`, encodeURIComponent(String(requestParameters.namespace))),
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse<any>(response);
    }

    /**
     * Delete a namespace from a serverless index. Deleting a namespace is irreversible; all data in the namespace is permanently deleted.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * Delete a namespace
     */
    async deleteNamespace(requestParameters: DeleteNamespaceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<object> {
        const response = await this.deleteNamespaceRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Describe a namespace in a serverless index, including the total number of vectors in the namespace.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * Describe a namespace
     */
    async describeNamespaceRaw(requestParameters: DescribeNamespaceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<NamespaceDescription>> {
        if (requestParameters.namespace === null || requestParameters.namespace === undefined) {
            throw new runtime.RequiredError('namespace','Required parameter requestParameters.namespace was null or undefined when calling describeNamespace.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/namespaces/{namespace}`.replace(`{${"namespace"}}`, encodeURIComponent(String(requestParameters.namespace))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => NamespaceDescriptionFromJSON(jsonValue));
    }

    /**
     * Describe a namespace in a serverless index, including the total number of vectors in the namespace.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * Describe a namespace
     */
    async describeNamespace(requestParameters: DescribeNamespaceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<NamespaceDescription> {
        const response = await this.describeNamespaceRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List all namespaces in a serverless index.  Up to 100 namespaces are returned at a time by default, in sorted order (bitwise “C” collation). If the `limit` parameter is set, up to that number of namespaces are returned instead. Whenever there are additional namespaces to return, the response also includes a `pagination_token` that you can use to get the next batch of namespaces. When the response does not include a `pagination_token`, there are no more namespaces to return.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * List namespaces
     */
    async listNamespacesOperationRaw(requestParameters: ListNamespacesOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ListNamespacesResponse>> {
        const queryParameters: any = {};

        if (requestParameters.limit !== undefined) {
            queryParameters['limit'] = requestParameters.limit;
        }

        if (requestParameters.paginationToken !== undefined) {
            queryParameters['paginationToken'] = requestParameters.paginationToken;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/namespaces`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ListNamespacesResponseFromJSON(jsonValue));
    }

    /**
     * List all namespaces in a serverless index.  Up to 100 namespaces are returned at a time by default, in sorted order (bitwise “C” collation). If the `limit` parameter is set, up to that number of namespaces are returned instead. Whenever there are additional namespaces to return, the response also includes a `pagination_token` that you can use to get the next batch of namespaces. When the response does not include a `pagination_token`, there are no more namespaces to return.  For guidance and examples, see [Manage namespaces](https://docs.pinecone.io/guides/manage-data/manage-namespaces).  **Note:** This operation is not supported for pod-based indexes.
     * List namespaces
     */
    async listNamespacesOperation(requestParameters: ListNamespacesOperationRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ListNamespacesResponse> {
        const response = await this.listNamespacesOperationRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
