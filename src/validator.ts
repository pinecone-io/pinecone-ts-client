import Ajv from 'ajv';
import { PineconeArgumentError } from './errors';

export const buildValidator = (schema: any, methodName: string) => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  return (data: any) => {
    const valid = validate(data);
    if (!valid) {
      const message = validate.errors?.map((error) => error.message).join('\n');
      throw new PineconeArgumentError(
        `Argument to ${methodName} ${message || ''}`
      );
    }
    return data;
  };
};
