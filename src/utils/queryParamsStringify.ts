import type { HTTPQuery } from '../pinecone-generated-ts-fetch';

export function queryParamsStringify(
  params: HTTPQuery,
  prefix: string = ''
): string {
  return Object.keys(params)
    .map((key) => querystringSingleKey(key, params[key], prefix))
    .filter((part) => part.length > 0)
    .join('&');
}

function querystringSingleKey(
  key: string,
  value:
    | string
    | number
    | null
    | undefined
    | boolean
    | Array<string | number | null | boolean>
    | Set<string | number | null | boolean>
    | HTTPQuery,
  keyPrefix: string = ''
): string {
  const fullKey = keyPrefix + (keyPrefix.length ? `[${key}]` : key);

  // This is a one line change from the default querystring implementation. Checking
  // with `Array.isArray` instead of `value instanceof Array` allows us to get the
  // the correct behavior when stringifying array params.
  if (Array.isArray(value)) {
    const multiValue = value
      .map((singleValue) => encodeURIComponent(String(singleValue)))
      .join(`&${encodeURIComponent(fullKey)}=`);
    return `${encodeURIComponent(fullKey)}=${multiValue}`;
  }
  if (value instanceof Set) {
    const valueAsArray = Array.from(value);
    return querystringSingleKey(key, valueAsArray, keyPrefix);
  }
  if (value instanceof Date) {
    return `${encodeURIComponent(fullKey)}=${encodeURIComponent(
      value.toISOString()
    )}`;
  }
  if (value instanceof Object) {
    return queryParamsStringify(value as HTTPQuery, fullKey);
  }
  return `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`;
}
