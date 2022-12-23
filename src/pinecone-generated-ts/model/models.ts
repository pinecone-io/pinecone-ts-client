import localVarRequest from 'request';

export * from './approximatedConfig';
export * from './collectionMeta';
export * from './createCollectionRequest';
export * from './createRequest';
export * from './createRequestIndexConfig';
export * from './deleteRequest';
export * from './describeIndexStatsRequest';
export * from './describeIndexStatsResponse';
export * from './fetchResponse';
export * from './hnswConfig';
export * from './indexMeta';
export * from './indexMetaDatabase';
export * from './indexMetaDatabaseIndexConfig';
export * from './indexMetaDatabaseStatus';
export * from './namespaceSummary';
export * from './patchRequest';
export * from './protobufAny';
export * from './protobufNullValue';
export * from './queryRequest';
export * from './queryResponse';
export * from './queryVector';
export * from './rpcStatus';
export * from './scoredVector';
export * from './singleQueryResults';
export * from './updateRequest';
export * from './upsertRequest';
export * from './upsertResponse';
export * from './vector';

import * as fs from 'fs';

export interface RequestDetailedFile {
    value: Buffer;
    options?: {
        filename?: string;
        contentType?: string;
    }
}

export type RequestFile = string | Buffer | fs.ReadStream | RequestDetailedFile;


import { ApproximatedConfig } from './approximatedConfig';
import { CollectionMeta } from './collectionMeta';
import { CreateCollectionRequest } from './createCollectionRequest';
import { CreateRequest } from './createRequest';
import { CreateRequestIndexConfig } from './createRequestIndexConfig';
import { DeleteRequest } from './deleteRequest';
import { DescribeIndexStatsRequest } from './describeIndexStatsRequest';
import { DescribeIndexStatsResponse } from './describeIndexStatsResponse';
import { FetchResponse } from './fetchResponse';
import { HnswConfig } from './hnswConfig';
import { IndexMeta } from './indexMeta';
import { IndexMetaDatabase } from './indexMetaDatabase';
import { IndexMetaDatabaseIndexConfig } from './indexMetaDatabaseIndexConfig';
import { IndexMetaDatabaseStatus } from './indexMetaDatabaseStatus';
import { NamespaceSummary } from './namespaceSummary';
import { PatchRequest } from './patchRequest';
import { ProtobufAny } from './protobufAny';
import { ProtobufNullValue } from './protobufNullValue';
import { QueryRequest } from './queryRequest';
import { QueryResponse } from './queryResponse';
import { QueryVector } from './queryVector';
import { RpcStatus } from './rpcStatus';
import { ScoredVector } from './scoredVector';
import { SingleQueryResults } from './singleQueryResults';
import { UpdateRequest } from './updateRequest';
import { UpsertRequest } from './upsertRequest';
import { UpsertResponse } from './upsertResponse';
import { Vector } from './vector';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: {[index: string]: any} = {
        "IndexMetaDatabaseStatus.StateEnum": IndexMetaDatabaseStatus.StateEnum,
        "ProtobufNullValue": ProtobufNullValue,
}

let typeMap: {[index: string]: any} = {
    "ApproximatedConfig": ApproximatedConfig,
    "CollectionMeta": CollectionMeta,
    "CreateCollectionRequest": CreateCollectionRequest,
    "CreateRequest": CreateRequest,
    "CreateRequestIndexConfig": CreateRequestIndexConfig,
    "DeleteRequest": DeleteRequest,
    "DescribeIndexStatsRequest": DescribeIndexStatsRequest,
    "DescribeIndexStatsResponse": DescribeIndexStatsResponse,
    "FetchResponse": FetchResponse,
    "HnswConfig": HnswConfig,
    "IndexMeta": IndexMeta,
    "IndexMetaDatabase": IndexMetaDatabase,
    "IndexMetaDatabaseIndexConfig": IndexMetaDatabaseIndexConfig,
    "IndexMetaDatabaseStatus": IndexMetaDatabaseStatus,
    "NamespaceSummary": NamespaceSummary,
    "PatchRequest": PatchRequest,
    "ProtobufAny": ProtobufAny,
    "QueryRequest": QueryRequest,
    "QueryResponse": QueryResponse,
    "QueryVector": QueryVector,
    "RpcStatus": RpcStatus,
    "ScoredVector": ScoredVector,
    "SingleQueryResults": SingleQueryResults,
    "UpdateRequest": UpdateRequest,
    "UpsertRequest": UpsertRequest,
    "UpsertResponse": UpsertResponse,
    "Vector": Vector,
}

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if(typeMap[discriminatorType]){
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.serialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return data.toISOString();
        } else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.deserialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap[type]) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}

export interface Authentication {
    /**
    * Apply authentication settings to header and query params.
    */
    applyToRequest(requestOptions: localVarRequest.Options): Promise<void> | void;
}

export class HttpBasicAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        requestOptions.auth = {
            username: this.username, password: this.password
        }
    }
}

export class HttpBearerAuth implements Authentication {
    public accessToken: string | (() => string) = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            const accessToken = typeof this.accessToken === 'function'
                            ? this.accessToken()
                            : this.accessToken;
            requestOptions.headers["Authorization"] = "Bearer " + accessToken;
        }
    }
}

export class ApiKeyAuth implements Authentication {
    public apiKey: string = '';

    constructor(private location: string, private paramName: string) {
    }

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (this.location == "query") {
            (<any>requestOptions.qs)[this.paramName] = this.apiKey;
        } else if (this.location == "header" && requestOptions && requestOptions.headers) {
            requestOptions.headers[this.paramName] = this.apiKey;
        } else if (this.location == 'cookie' && requestOptions && requestOptions.headers) {
            if (requestOptions.headers['Cookie']) {
                requestOptions.headers['Cookie'] += '; ' + this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
            else {
                requestOptions.headers['Cookie'] = this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
        }
    }
}

export class OAuth implements Authentication {
    public accessToken: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
    }
}

export class VoidAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(_: localVarRequest.Options): void {
        // Do nothing
    }
}

export type Interceptor = (requestOptions: localVarRequest.Options) => (Promise<void> | void);
