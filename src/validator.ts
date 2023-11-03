import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { PineconeArgumentError } from './errors';
import { isEdge } from './utils/environment';

const prepend = (prefix: string, message: string) => {
  return `${prefix} ${message}`;
};

const schemaPathPropNameRegex = /properties\/(.+)\//;
const schemaPathArrayPropNameRegex = /properties\/(.+)\/items/;
const schemaPathGroupNumberRegex = /anyOf\/(\d+)\/(.+)/;
const instancePathItemIndexRegex = /(\d+)$/;

// If there are more than maxErrors errors in a group, they
// will get summarized with an error count.
const maxErrors = 3;

const formatIndividualError = (e, formattedMessageList) => {
  if (e.schemaPath.indexOf('properties') > -1) {
    // property of an object
    if (e.schemaPath.indexOf('items') > -1) {
      // property is an array
      const propNameMatch = schemaPathArrayPropNameRegex.exec(e.schemaPath);
      const propName = propNameMatch ? propNameMatch[1] : 'unknown';
      const itemIndexMatch = instancePathItemIndexRegex.exec(e.instancePath);
      const itemIndex = itemIndexMatch ? itemIndexMatch[1] : 'unknown';
      formattedMessageList.push(
        `item at index ${itemIndex} of the '${propName}' array ${e.message}`
      );
    } else {
      // property is not an array
      const propNameMatch = schemaPathPropNameRegex.exec(e.schemaPath);
      const propName = propNameMatch ? propNameMatch[1] : 'unknown';
      formattedMessageList.push(`property '${propName}' ${e.message}`);
    }
  } else if (e.schemaPath.indexOf('items') > -1) {
    // item in an array
    const itemIndexMatch = instancePathItemIndexRegex.exec(e.instancePath);
    const itemIndex = itemIndexMatch ? itemIndexMatch[1] : 'unknown';
    formattedMessageList.push(
      `item at index ${itemIndex} of the array ${e.message}`
    );
  } else if (e.instancePath === '') {
    // parameter is something other than an object, e.g. string
    formattedMessageList.push(`argument ${e.message}`);
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
      `${messageParts.length > 0 ? 'M' : 'm'}ust have required ${
        missingPropertyNames.length > 1 ? 'properties' : 'property'
      }: ${missingPropertyNames.join(', ')}.`
    );
    messageParts.push(missingMessage);
  }
};

const neverErrors = (
  subject: string,
  errors: Array<ErrorObject>,
  messageParts: Array<string>
) => {
  const neverPropertyErrors = errors
    .filter((error) => error.keyword === 'not')
    .map((error) => {
      return error.instancePath.slice(1);
    });
  if (neverPropertyErrors.length > 0) {
    const neverMessage = prepend(
      subject,
      `must not have ${
        neverPropertyErrors.length > 1 ? 'properties' : 'property'
      }: ${neverPropertyErrors.join(', ')}.`
    );
    messageParts.push(neverMessage);
  }
};

const typeErrors = (
  subject: string,
  errors: Array<ErrorObject>,
  messageParts: Array<string>
) => {
  const typeErrorsList: Array<string> = [];
  const anyOfConstPropErrors: Array<ErrorObject> = errors.filter(
    (error) =>
      error.schemaPath.indexOf('anyOf') > -1 &&
      error.keyword === 'const' &&
      error.instancePath.length > 0
  );
  let errorCount = 0;

  // handle possible literal types first
  const propErrorGroups: { [key: string]: Array<ErrorObject> } = {};
  if (anyOfConstPropErrors.length > 0) {
    for (const error of anyOfConstPropErrors) {
      const constValue = error.instancePath.slice(1);

      if (propErrorGroups[constValue]) {
        propErrorGroups[constValue].push(error);
      } else {
        propErrorGroups[constValue] = [error];
      }
    }
    const properties = Object.keys(propErrorGroups);

    properties.forEach((property) => {
      const constValueErrors = propErrorGroups[property];

      typeErrorsList.push(
        `property '${property}' is a constant which must be equal to one of: ` +
          Object.values(constValueErrors)
            .map((group) => `'${group.params.allowedValue}'`)
            .join(', ')
      );
    });
  }

  // typebox also emits type errors for each value of a literal so we want to exclude these
  const anyOfKeys = Object.keys(propErrorGroups);
  for (let i = 0; i < errors.length; i++) {
    const e = errors[i];

    if (e.keyword === 'type' && !anyOfKeys.includes(e.instancePath.slice(1))) {
      errorCount += 1;
      if (errorCount <= maxErrors) {
        formatIndividualError(e, typeErrorsList);
      }
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
  for (const e of errors) {
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
        break;
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
  const messageParts: Array<string> = [];

  const anyOfArgumentErrors = errors.filter(
    (error) =>
      error.schemaPath.indexOf('anyOf') > -1 &&
      error.keyword !== 'anyOf' &&
      error.keyword !== 'const' &&
      error.keyword !== 'type'
  );

  if (anyOfArgumentErrors.length > 0) {
    const groups = {};
    for (const error of anyOfArgumentErrors) {
      const schemaPathMatch = schemaPathGroupNumberRegex.exec(error.schemaPath);
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
      Object.entries(groups)
        .map(
          ([key, group]) =>
            `${parseInt(key) + 1})` +
            errorFormatter('', group as Array<ErrorObject>)
        )
        .join(' ')
    );
  }

  neverErrors(subject, errors, messageParts);
  missingPropertiesErrors(subject, errors, messageParts);
  typeErrors(subject, errors, messageParts);
  validationErrors(subject, errors, messageParts);

  return messageParts.join(' ');
};

export const buildValidator = (errorMessagePrefix: string, schema: any) => {
  if (isEdge()) {
    // Ajv schema compilation does not work in the Edge Runtime.
    return (data: any) => {}; // eslint-disable-line
  }

  if (
    typeof process !== 'undefined' &&
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
    return (data: any) => {}; // eslint-disable-line
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
