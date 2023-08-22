import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { PineconeArgumentError } from './errors';

const prepend = (prefix: string, message: string) => {
  return `${prefix} ${message}`;
};

const propNameRegex = /properties\/(.+)\//;
const arrayPropNameRegex = /properties\/(.+)\/items/;
const itemIndexRegex = /(\d+)$/;
const maxErrors = 3;

const formatIndividualError = (e, formattedMessageList) => {
  if (e.schemaPath.indexOf('properties') > -1) {
    // property of an object
    if (e.schemaPath.indexOf('items') > -1) {
      // property is an array
      const propNameMatch = arrayPropNameRegex.exec(e.schemaPath);
      const propName = propNameMatch ? propNameMatch[1] : 'unknown';
      const itemIndexMatch = itemIndexRegex.exec(e.instancePath);
      const itemIndex = itemIndexMatch ? itemIndexMatch[1] : 'unknown';
      formattedMessageList.push(
        `item at index ${itemIndex} of the '${propName}' array ${e.message}`
      );
    } else {
      // property is not an array
      const propNameMatch = propNameRegex.exec(e.schemaPath);
      const propName = propNameMatch ? propNameMatch[1] : 'unknown';
      formattedMessageList.push(`property '${propName}' ${e.message}`);
    }
  } else if (e.schemaPath.indexOf('items') > -1) {
    // item in an array
    const itemIndexMatch = itemIndexRegex.exec(e.instancePath);
    const itemIndex = itemIndexMatch ? itemIndexMatch[1] : 'unknown';
    formattedMessageList.push(
      `item at index ${itemIndex} of the array ${e.message}`
    );
  } else if (e.instancePath === '') {
    // parameter is something other than an object, e.g. string
    formattedMessageList.push(`the argument ${e.message}`);
  }
};

const missingPropertiesErrors = (
  subject: string,
  errors: Array<ErrorObject>,
  messageParts: Array<string>
) => {
  const missingPropertyNames = errors
    .filter((error) => error.keyword === 'required')
    .map((error) => {
      return error.params.missingProperty !== undefined
        ? error.params.missingProperty
        : 'unknown';
    });
  if (missingPropertyNames.length > 0) {
    const missingMessage = prepend(
      subject,
      `must have required properties: ${missingPropertyNames.join(', ')}.`
    );
    messageParts.push(missingMessage);
  }
};

const typeErrors = (
  subject: string,
  errors: Array<ErrorObject>,
  messageParts: Array<string>
) => {
  const typeErrorsList: Array<string> = [];
  let errorCount = 0;

  for (var i = 0; i < errors.length; i++) {
    let e = errors[i];

    switch (e.keyword) {
      case 'type':
        errorCount += 1;
        if (errorCount > maxErrors) {
          continue;
        } else {
          formatIndividualError(e, typeErrorsList);
        }
      default:
      // noop, other non-validation error handled elsewhere
    }
  }

  if (errorCount > maxErrors) {
    typeErrorsList.push(`and ${errorCount - maxErrors} other errors`);
  }

  if (typeErrorsList.length > 0) {
    const prefix =
      messageParts.length > 0
        ? 'There were also type errors:'
        : `${subject} had type errors:`;
    const typeErrorMessage = prepend(prefix, typeErrorsList.join(', ')) + '.';

    messageParts.push(typeErrorMessage);
  }
};

const validationErrors = (
  subject: string,
  errors: Array<ErrorObject>,
  messageParts: Array<string>
) => {
  const validationErrors: Array<string> = [];
  let errorCount = 0;

  // List of error keywords from https://ajv.js.org/api.html#validation-errors
  for (var i = 0; i < errors.length; i++) {
    let e = errors[i];

    if (e.keyword === 'minLength' && e.params.limit === 1) {
      e.message = 'must not be blank';
    }

    switch (e.keyword) {
      case 'minimum':
      case 'maximum':
      case 'exclusiveMinimum':
      case 'exclusiveMaximum':
      case 'minLength':
      case 'maxLength':
      case 'maxProperties':
      case 'minProperties':
      case 'minItems':
      case 'maxItems':
      case 'additionalItems':
      case 'additionalProperties':
        errorCount += 1;
        if (errorCount > maxErrors) {
          continue;
        } else {
          formatIndividualError(e, validationErrors);
        }
      default:
      // noop, other non-validation error handled elsewhere
    }
  }

  if (errorCount > maxErrors) {
    validationErrors.push(`and ${errorCount - maxErrors} other errors`);
  }

  if (validationErrors.length > 0) {
    const prefix =
      messageParts.length > 0
        ? 'There were also validation errors:'
        : `${subject} had validation errors:`;
    const validationErrorMessage =
      prepend(prefix, validationErrors.join(', ')) + '.';

    messageParts.push(validationErrorMessage);
  }
};

export const errorFormatter = (subject: string, errors: Array<ErrorObject>) => {
  const anyOfErrors = errors.filter(
    (error) =>
      error.schemaPath.indexOf('anyOf') > -1 && error.keyword !== 'anyOf'
  );
  if (anyOfErrors.length > 0) {
    const groups = {};
    for (let i = 0; i < anyOfErrors.length; i++) {
      let error = anyOfErrors[i];

      const schemaPathRegex = /anyOf\/(\d+)\/(.+)/;
      const schemaPathMatch = schemaPathRegex.exec(error.schemaPath);
      const groupNumber = schemaPathMatch ? schemaPathMatch[1] : 'unknown';
      // Remove the anyOf portion of the schema path to avoid infinite loop
      // when building message for each error group
      error.schemaPath = schemaPathMatch ? schemaPathMatch[2] : 'unknown';

      if (groups[groupNumber]) {
        groups[groupNumber].push(error);
      } else {
        groups[groupNumber] = [error];
      }
    }

    // concat errors for each error group
    return (
      `${subject} accepts multiple types. Either ` +
      Object.keys(groups)
        .map((key) => {
          const group = groups[key];
          return `${parseInt(key) + 1})` + errorFormatter('', group);
        })
        .join(' ')
    );
  }

  const messageParts: Array<string> = [];

  missingPropertiesErrors(subject, errors, messageParts);
  typeErrors(subject, errors, messageParts);
  validationErrors(subject, errors, messageParts);

  return messageParts.join(' ');
};

export const buildValidator = (errorMessagePrefix: string, schema: any) => {
  if (
    process &&
    process.env &&
    process.env.PINECONE_DISABLE_RUNTIME_VALIDATIONS
  ) {
    // Runtime method validations are most useful when learning to use the client
    // in an interactive REPL or when developing an application that does not use
    // Typescript to provide the benefits of static type-checking. However, if your
    // application is using Typescript and/or you have gained confidence of correct
    // usage through testing, you may want to disable these runtime validations
    // to improve performance.
    //
    // The PINECONE_DISABLE_RUNTIME_VALIDATIONS env var provides a way to disable
    // all runtime validation. If it is set, all validator functions will immediately
    // return without performing any validation.
    return (data: any) => {};
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  return (data: any) => {
    const valid = validate(data);
    if (!valid) {
      const errors = validate.errors || ([] as Array<ErrorObject>);
      const msg = errorFormatter(errorMessagePrefix, errors);
      throw new PineconeArgumentError(msg);
    }
    return data;
  };
};

export const buildConfigValidator = (schema: any, methodName: string) => {
  const prefix = `The argument to ${methodName}`;
  return buildValidator(prefix, schema);
};
