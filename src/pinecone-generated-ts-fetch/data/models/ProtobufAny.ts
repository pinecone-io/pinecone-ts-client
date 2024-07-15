/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Data Plane API
 * Pinecone is a vector database that makes it easy to search and retrieve billions of high-dimensional vectors.
 *
 * The version of the OpenAPI document: 2024-07
 * Contact: support@pinecone.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 *
 * @export
 * @interface ProtobufAny
 */
export interface ProtobufAny {
  /**
   *
   * @type {string}
   * @memberof ProtobufAny
   */
  typeUrl?: string;
  /**
   *
   * @type {string}
   * @memberof ProtobufAny
   */
  value?: string;
}

/**
 * Check if a given object implements the ProtobufAny interface.
 */
export function instanceOfProtobufAny(value: object): boolean {
  let isInstance = true;

  return isInstance;
}

export function ProtobufAnyFromJSON(json: any): ProtobufAny {
  return ProtobufAnyFromJSONTyped(json, false);
}

export function ProtobufAnyFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): ProtobufAny {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    typeUrl: !exists(json, 'typeUrl') ? undefined : json['typeUrl'],
    value: !exists(json, 'value') ? undefined : json['value'],
  };
}

export function ProtobufAnyToJSON(value?: ProtobufAny | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    typeUrl: value.typeUrl,
    value: value.value,
  };
}
