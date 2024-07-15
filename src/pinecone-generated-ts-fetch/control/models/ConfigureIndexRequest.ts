/* tslint:disable */
/* eslint-disable */
/**
 * Pinecone Control Plane API
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
import type { ConfigureIndexRequestSpec } from './ConfigureIndexRequestSpec';
import {
  ConfigureIndexRequestSpecFromJSON,
  ConfigureIndexRequestSpecFromJSONTyped,
  ConfigureIndexRequestSpecToJSON,
} from './ConfigureIndexRequestSpec';

/**
 * Configuration used to scale an index.
 * @export
 * @interface ConfigureIndexRequest
 */
export interface ConfigureIndexRequest {
  /**
   *
   * @type {ConfigureIndexRequestSpec}
   * @memberof ConfigureIndexRequest
   */
  spec: ConfigureIndexRequestSpec;
}

/**
 * Check if a given object implements the ConfigureIndexRequest interface.
 */
export function instanceOfConfigureIndexRequest(value: object): boolean {
  let isInstance = true;
  isInstance = isInstance && 'spec' in value;

  return isInstance;
}

export function ConfigureIndexRequestFromJSON(
  json: any
): ConfigureIndexRequest {
  return ConfigureIndexRequestFromJSONTyped(json, false);
}

export function ConfigureIndexRequestFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): ConfigureIndexRequest {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    spec: ConfigureIndexRequestSpecFromJSON(json['spec']),
  };
}

export function ConfigureIndexRequestToJSON(
  value?: ConfigureIndexRequest | null
): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    spec: ConfigureIndexRequestSpecToJSON(value.spec),
  };
}
