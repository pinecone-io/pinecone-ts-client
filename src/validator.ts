import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { PineconeArgumentError } from './errors';

export const buildValidator = (
  schema: any,
  onError: (errorsList: string[]) => void
) => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  return (data: any) => {
    const valid = validate(data);
    if (!valid) {
      const errors = validate.errors || ([] as Array<ErrorObject>);
      const errorsList = errors
        .map((error) => {
          if (error.message === 'must NOT have fewer than 1 characters') {
            error.message = 'must not be blank';
          }
          return error;
        })
        .map((error) => {
          if (error.instancePath) {
            return `the field '${error.instancePath.slice(1)}' ${
              error.message
            }`;
          } else {
            return `${error.message}`;
          }
        })
        .filter((message): message is string => message !== undefined);
      onError(errorsList);
    }
    return data;
  };
};

export const buildDataPlaneOperationsValidator = (
  schema: any,
  methodName: string
) => {
  return buildValidator(schema, (errorsList) => {
    const message = errorsList.join('\n');
    throw new PineconeArgumentError(
      `Argument to ${methodName} ${message || ''}`
    );
  });
};
