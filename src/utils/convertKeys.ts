// converts keys of a json payload from snake_case to camelCase
export const convertKeysToCamelCase = (object: any) => {
  if (Array.isArray(object)) {
    return object.map((item) => convertKeysToCamelCase(item));
  } else if (object !== null && typeof object === 'object') {
    return Object.entries(object).reduce((acc, [key, value]) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return object; // return primitives as is
};

// converts snake-case keys to camelCase
const toCamelCase = (str: string) =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
