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


import * as runtime from '../runtime';
import type {
  AssistantFileModel,
  Chat,
  ChatCompletionAssistant200Response,
  ChatCompletionModel,
  ChatModel,
  ContextModel,
  ContextRequest,
  ListFiles200Response,
  ListFiles401Response,
  SearchCompletions,
} from '../models/index';
import {
    AssistantFileModelFromJSON,
    AssistantFileModelToJSON,
    ChatFromJSON,
    ChatToJSON,
    ChatCompletionAssistant200ResponseFromJSON,
    ChatCompletionAssistant200ResponseToJSON,
    ChatCompletionModelFromJSON,
    ChatCompletionModelToJSON,
    ChatModelFromJSON,
    ChatModelToJSON,
    ContextModelFromJSON,
    ContextModelToJSON,
    ContextRequestFromJSON,
    ContextRequestToJSON,
    ListFiles200ResponseFromJSON,
    ListFiles200ResponseToJSON,
    ListFiles401ResponseFromJSON,
    ListFiles401ResponseToJSON,
    SearchCompletionsFromJSON,
    SearchCompletionsToJSON,
} from '../models/index';

export interface ChatAssistantRequest {
    assistantName: string;
    chat: Chat;
}

export interface ChatCompletionAssistantRequest {
    assistantName: string;
    searchCompletions: SearchCompletions;
}

export interface ContextAssistantRequest {
    assistantName: string;
    contextRequest: ContextRequest;
}

export interface DeleteFileRequest {
    assistantName: string;
    assistantFileId: string;
}

export interface DescribeFileRequest {
    assistantName: string;
    assistantFileId: string;
    includeUrl?: DescribeFileIncludeUrlEnum;
}

export interface ListFilesRequest {
    assistantName: string;
    filter?: string;
}

export interface UploadFileRequest {
    assistantName: string;
    file: Blob;
    metadata?: string;
}

/**
 * 
 */
export class ManageAssistantsApi extends runtime.BaseAPI {

    /**
     * The `chat_assistant` endpoint allows you to [chat with an assistant](https://docs.pinecone.io/guides/assistant/chat-with-assistant) and get back citations in structured form.   This is the recommended way to chat with an assistant, as it offers more functionality and control over the assistant\'s responses and references than the `chat_completion_assistant` endpoint.
     * Chat with an assistant
     */
    async chatAssistantRaw(requestParameters: ChatAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ChatModel>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling chatAssistant.');
        }

        if (requestParameters.chat === null || requestParameters.chat === undefined) {
            throw new runtime.RequiredError('chat','Required parameter requestParameters.chat was null or undefined when calling chatAssistant.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/chat/{assistant_name}`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: ChatToJSON(requestParameters.chat),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ChatModelFromJSON(jsonValue));
    }

    /**
     * The `chat_assistant` endpoint allows you to [chat with an assistant](https://docs.pinecone.io/guides/assistant/chat-with-assistant) and get back citations in structured form.   This is the recommended way to chat with an assistant, as it offers more functionality and control over the assistant\'s responses and references than the `chat_completion_assistant` endpoint.
     * Chat with an assistant
     */
    async chatAssistant(requestParameters: ChatAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ChatModel> {
        const response = await this.chatAssistantRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `chat_completion_assistant` endpoint is used to [chat with an assistant](https://docs.pinecone.io/guides/assistant/chat-with-assistant). This endpoint is based on the OpenAI Chat Completion API, a commonly used and adopted API.   It is useful if you need inline citations or OpenAI-compatible responses, but has limited functionality compared to the [`chat_assistant`](https://docs.pinecone.io/reference/api/2024-07/assistant/chat_assistant) operation.
     * Chat through an OpenAI-compatible interface
     */
    async chatCompletionAssistantRaw(requestParameters: ChatCompletionAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ChatCompletionModel>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling chatCompletionAssistant.');
        }

        if (requestParameters.searchCompletions === null || requestParameters.searchCompletions === undefined) {
            throw new runtime.RequiredError('searchCompletions','Required parameter requestParameters.searchCompletions was null or undefined when calling chatCompletionAssistant.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/chat/{assistant_name}/chat/completions`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: SearchCompletionsToJSON(requestParameters.searchCompletions),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ChatCompletionModelFromJSON(jsonValue));
    }

    /**
     * The `chat_completion_assistant` endpoint is used to [chat with an assistant](https://docs.pinecone.io/guides/assistant/chat-with-assistant). This endpoint is based on the OpenAI Chat Completion API, a commonly used and adopted API.   It is useful if you need inline citations or OpenAI-compatible responses, but has limited functionality compared to the [`chat_assistant`](https://docs.pinecone.io/reference/api/2024-07/assistant/chat_assistant) operation.
     * Chat through an OpenAI-compatible interface
     */
    async chatCompletionAssistant(requestParameters: ChatCompletionAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ChatCompletionModel> {
        const response = await this.chatCompletionAssistantRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `context_assistant` endpoint allows you to retrieve context from an assistant that might be used as part of RAG or any agentic flow.
     * Retrieve context from an assistant
     */
    async contextAssistantRaw(requestParameters: ContextAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ContextModel>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling contextAssistant.');
        }

        if (requestParameters.contextRequest === null || requestParameters.contextRequest === undefined) {
            throw new runtime.RequiredError('contextRequest','Required parameter requestParameters.contextRequest was null or undefined when calling contextAssistant.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/chat/{assistant_name}/context`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: ContextRequestToJSON(requestParameters.contextRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ContextModelFromJSON(jsonValue));
    }

    /**
     * The `context_assistant` endpoint allows you to retrieve context from an assistant that might be used as part of RAG or any agentic flow.
     * Retrieve context from an assistant
     */
    async contextAssistant(requestParameters: ContextAssistantRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ContextModel> {
        const response = await this.contextAssistantRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `delete_file` endpoint [deletes an uploaded file](https://docs.pinecone.io/guides/assistant/manage-files#delete-a-file) from an assistant.
     * Delete an uploaded file
     */
    async deleteFileRaw(requestParameters: DeleteFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling deleteFile.');
        }

        if (requestParameters.assistantFileId === null || requestParameters.assistantFileId === undefined) {
            throw new runtime.RequiredError('assistantFileId','Required parameter requestParameters.assistantFileId was null or undefined when calling deleteFile.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/files/{assistant_name}/{assistant_file_id}`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))).replace(`{${"assistant_file_id"}}`, encodeURIComponent(String(requestParameters.assistantFileId))),
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * The `delete_file` endpoint [deletes an uploaded file](https://docs.pinecone.io/guides/assistant/manage-files#delete-a-file) from an assistant.
     * Delete an uploaded file
     */
    async deleteFile(requestParameters: DeleteFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.deleteFileRaw(requestParameters, initOverrides);
    }

    /**
     * The `describe_file` endpoint provides the [current status and metadata of a file](https://docs.pinecone.io/guides/assistant/manage-files#get-the-status-of-a-file) uploaded to an assistant.
     * Describe a file upload
     */
    async describeFileRaw(requestParameters: DescribeFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AssistantFileModel>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling describeFile.');
        }

        if (requestParameters.assistantFileId === null || requestParameters.assistantFileId === undefined) {
            throw new runtime.RequiredError('assistantFileId','Required parameter requestParameters.assistantFileId was null or undefined when calling describeFile.');
        }

        const queryParameters: any = {};

        if (requestParameters.includeUrl !== undefined) {
            queryParameters['include_url'] = requestParameters.includeUrl;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/files/{assistant_name}/{assistant_file_id}`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))).replace(`{${"assistant_file_id"}}`, encodeURIComponent(String(requestParameters.assistantFileId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AssistantFileModelFromJSON(jsonValue));
    }

    /**
     * The `describe_file` endpoint provides the [current status and metadata of a file](https://docs.pinecone.io/guides/assistant/manage-files#get-the-status-of-a-file) uploaded to an assistant.
     * Describe a file upload
     */
    async describeFile(requestParameters: DescribeFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AssistantFileModel> {
        const response = await this.describeFileRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `list_files` endpoint returns a [list of all files in an assistant](https://docs.pinecone.io//guides/assistant/manage-files#list-files-in-an-assistant), with an option to filter files with metadata.
     * List Files
     */
    async listFilesRaw(requestParameters: ListFilesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ListFiles200Response>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling listFiles.');
        }

        const queryParameters: any = {};

        if (requestParameters.filter !== undefined) {
            queryParameters['filter'] = requestParameters.filter;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const response = await this.request({
            path: `/assistant/files/{assistant_name}`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ListFiles200ResponseFromJSON(jsonValue));
    }

    /**
     * The `list_files` endpoint returns a [list of all files in an assistant](https://docs.pinecone.io//guides/assistant/manage-files#list-files-in-an-assistant), with an option to filter files with metadata.
     * List Files
     */
    async listFiles(requestParameters: ListFilesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ListFiles200Response> {
        const response = await this.listFilesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * The `upload_file` endpoint [uploads a file](https://docs.pinecone.io/guides/assistant/upload-file) to the specified assistant.
     * Upload file to assistant
     */
    async uploadFileRaw(requestParameters: UploadFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AssistantFileModel>> {
        if (requestParameters.assistantName === null || requestParameters.assistantName === undefined) {
            throw new runtime.RequiredError('assistantName','Required parameter requestParameters.assistantName was null or undefined when calling uploadFile.');
        }

        if (requestParameters.file === null || requestParameters.file === undefined) {
            throw new runtime.RequiredError('file','Required parameter requestParameters.file was null or undefined when calling uploadFile.');
        }

        const queryParameters: any = {};

        if (requestParameters.metadata !== undefined) {
            queryParameters['metadata'] = requestParameters.metadata;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Api-Key"] = this.configuration.apiKey("Api-Key"); // ApiKeyAuth authentication
        }

        const consumes: runtime.Consume[] = [
            { contentType: 'multipart/form-data' },
        ];
        // @ts-ignore: canConsumeForm may be unused
        const canConsumeForm = runtime.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): any };
        let useForm = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        useForm = canConsumeForm;
        if (useForm) {
            formParams = new FormData();
        } else {
            formParams = new URLSearchParams();
        }

        if (requestParameters.file !== undefined) {
            formParams.append('file', requestParameters.file as any);
        }

        const response = await this.request({
            path: `/assistant/files/{assistant_name}`.replace(`{${"assistant_name"}}`, encodeURIComponent(String(requestParameters.assistantName))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: formParams,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AssistantFileModelFromJSON(jsonValue));
    }

    /**
     * The `upload_file` endpoint [uploads a file](https://docs.pinecone.io/guides/assistant/upload-file) to the specified assistant.
     * Upload file to assistant
     */
    async uploadFile(requestParameters: UploadFileRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AssistantFileModel> {
        const response = await this.uploadFileRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const DescribeFileIncludeUrlEnum = {
    True: 'true',
    False: 'false'
} as const;
export type DescribeFileIncludeUrlEnum = typeof DescribeFileIncludeUrlEnum[keyof typeof DescribeFileIncludeUrlEnum];
