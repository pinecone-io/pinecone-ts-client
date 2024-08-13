// // import { errorFormatter, buildValidator } from '../validator';
//
// describe('validation', () => {
//   test('can be disabled with environment variable when performance is the #1 concern', () => {
//     const enabledValidator = buildValidator('The test function', {
//       type: 'number',
//     });
//     const runEnabled = () => enabledValidator('not a number');
//     expect(runEnabled).toThrow();
//
//     process.env.PINECONE_DISABLE_RUNTIME_VALIDATIONS = 'true';
//     const disabledValidator = buildValidator('The test function', {
//       type: 'number',
//     });
//     const runDisabled = () => disabledValidator('not a number');
//     expect(runDisabled).not.toThrow();
//
//     // cleanup and verify cleanup
//     delete process.env.PINECONE_DISABLE_RUNTIME_VALIDATIONS;
//     const enabledValidator2 = buildValidator('The test function', {
//       type: 'number',
//     });
//     const runEnabled2 = () => enabledValidator2('not a number');
//     expect(runEnabled2).toThrow();
//   });
//
//   describe('errorFormatter', () => {
//     test('when argument is expecting object, return type error', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/type',
//           keyword: 'type',
//           params: { type: 'object' },
//
//           message: 'must be object',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         'The argument to createIndex had type errors: argument must be object.'
//       );
//     });
//
//     test('when argument is expecting string, return type error', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to describeIndex', validationErrors)
//       ).toEqual(
//         'The argument to describeIndex had type errors: argument must be string.'
//       );
//     });
//
//     test('when item in array has incorrect type', () => {
//       const validationErrors = [
//         {
//           instancePath: '/0',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//       ];
//
//       expect(errorFormatter('The argument to fetch', validationErrors)).toEqual(
//         'The argument to fetch had type errors: item at index 0 of the array must be string.'
//       );
//     });
//
//     test('when multiple required properties are missing', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/required',
//           keyword: 'required',
//           params: { missingProperty: 'name' },
//           message: "must have required property 'name'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/required',
//           keyword: 'required',
//           params: { missingProperty: 'dimension' },
//           message: "must have required property 'dimension'",
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         'The argument to createIndex must have required properties: name, dimension.'
//       );
//     });
//
//     test('when one required property is missing', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/required',
//           keyword: 'required',
//           params: { missingProperty: 'dimension' },
//           message: "must have required property 'dimension'",
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         'The argument to createIndex must have required property: dimension.'
//       );
//     });
//
//     test('when a property is the wrong type (multiple errors)', () => {
//       const validationErrors = [
//         {
//           instancePath: '/name',
//           schemaPath: '#/properties/name/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/dimension',
//           schemaPath: '#/properties/dimension/type',
//           keyword: 'type',
//           params: { type: 'integer' },
//           message: 'must be integer',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         "The argument to createIndex had type errors: property 'name' must be string, property 'dimension' must be integer."
//       );
//     });
//
//     test('when a property is the wrong type (single error)', () => {
//       const validationErrors = [
//         {
//           instancePath: '/name',
//           schemaPath: '#/properties/name/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         "The argument to createIndex had type errors: property 'name' must be string."
//       );
//     });
//
//     test('mixed error types (required and type)', () => {
//       // e.g. await client.createIndex({ name: 100 })
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/required',
//           keyword: 'required',
//           params: { missingProperty: 'dimension' },
//           message: "must have required property 'dimension'",
//         },
//         {
//           instancePath: '/name',
//           schemaPath: '#/properties/name/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         "The argument to createIndex must have required property: dimension. There were also type errors: property 'name' must be string."
//       );
//     });
//
//     test('when anyOf is in play returns both sets of errors', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/0/required',
//           keyword: 'required',
//           params: { missingProperty: 'id' },
//           message: "must have required property 'id'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/1/required',
//           keyword: 'required',
//           params: { missingProperty: 'vector' },
//           message: "must have required property 'vector'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf',
//           keyword: 'anyOf',
//           params: {},
//           message: 'must match a schema in anyOf',
//         },
//       ];
//
//       expect(errorFormatter('The argument to query', validationErrors)).toEqual(
//         'The argument to query accepts multiple types. Either 1) must have required property: id. 2) must have required property: vector.'
//       );
//     });
//
//     test('anyOf can handle multiple errors from each schema', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/0/required',
//           keyword: 'required',
//           params: { missingProperty: 'topK' },
//           message: "must have required property 'topK'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/0/required',
//           keyword: 'required',
//           params: { missingProperty: 'id' },
//           message: "must have required property 'id'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/1/required',
//           keyword: 'required',
//           params: { missingProperty: 'topK' },
//           message: "must have required property 'topK'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf/1/required',
//           keyword: 'required',
//           params: { missingProperty: 'vector' },
//           message: "must have required property 'vector'",
//         },
//         {
//           instancePath: '',
//           schemaPath: '#/anyOf',
//           keyword: 'anyOf',
//           params: {},
//           message: 'must match a schema in anyOf',
//         },
//       ];
//
//       expect(errorFormatter('The argument to query', validationErrors)).toEqual(
//         'The argument to query accepts multiple types. Either 1) must have required properties: topK, id. 2) must have required properties: topK, vector.'
//       );
//     });
//
//     test('when an object string property is blank', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/required',
//           keyword: 'required',
//           params: { missingProperty: 'dimension' },
//           message: "must have required property 'dimension'",
//         },
//         {
//           instancePath: '/name',
//           schemaPath: '#/properties/name/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         "The argument to createIndex must have required property: dimension. There were also validation errors: property 'name' must not be blank."
//       );
//     });
//
//     test('when an array string item is blank', () => {
//       const validationErrors = [
//         {
//           instancePath: '/0',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//       ];
//
//       expect(errorFormatter('The argument to fetch', validationErrors)).toEqual(
//         'The argument to fetch had validation errors: item at index 0 of the array must not be blank.'
//       );
//     });
//
//     test('when a string argument is blank', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to describeIndex', validationErrors)
//       ).toEqual(
//         'The argument to describeIndex had validation errors: argument must not be blank.'
//       );
//     });
//
//     test('when a number is out of range', () => {
//       const validationErrors = [
//         {
//           instancePath: '/dimension',
//           schemaPath: '#/properties/dimension/minimum',
//           keyword: 'minimum',
//           params: { comparison: '>=', limit: 1 },
//           message: 'must be >= 1',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to createIndex', validationErrors)
//       ).toEqual(
//         "The argument to createIndex had validation errors: property 'dimension' must be >= 1."
//       );
//     });
//
//     test('when numerous type errors, truncates the list with error count', () => {
//       const validationErrors = [
//         {
//           instancePath: '/0',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/1',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/2',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/3',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/4',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/5',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//         {
//           instancePath: '/6',
//           schemaPath: '#/items/type',
//           keyword: 'type',
//           params: { type: 'string' },
//           message: 'must be string',
//         },
//       ];
//
//       expect(errorFormatter('The argument to fetch', validationErrors)).toEqual(
//         'The argument to fetch had type errors: item at index 0 of the array must be string, item at index 1 of the array must be string, item at index 2 of the array must be string, and 4 other errors.'
//       );
//     });
//
//     test('when numerous validation errors, truncates the list with error count', () => {
//       const validationErrors = [
//         {
//           instancePath: '/0',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//         {
//           instancePath: '/1',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//         {
//           instancePath: '/2',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//         {
//           instancePath: '/3',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//         {
//           instancePath: '/4',
//           schemaPath: '#/items/minLength',
//           keyword: 'minLength',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 characters',
//         },
//       ];
//
//       expect(errorFormatter('The argument to fetch', validationErrors)).toEqual(
//         'The argument to fetch had validation errors: item at index 0 of the array must not be blank, item at index 1 of the array must not be blank, item at index 2 of the array must not be blank, and 2 other errors.'
//       );
//     });
//
//     test('minItems error mapped', () => {
//       const validationErrors = [
//         {
//           instancePath: '',
//           schemaPath: '#/minItems',
//           keyword: 'minItems',
//           params: { limit: 1 },
//           message: 'must NOT have fewer than 1 items',
//         },
//       ];
//
//       expect(errorFormatter('The argument to fetch', validationErrors)).toEqual(
//         'The argument to fetch had validation errors: argument must NOT have fewer than 1 items.'
//       );
//     });
//
//     test('correctly describes errors on object properties that are arrays', () => {
//       const validationErrors = [
//         {
//           instancePath: '/0/values/0',
//           schemaPath: '#/items/properties/values/items/type',
//           keyword: 'type',
//           params: { type: 'number' },
//           message: 'must be number',
//         },
//         {
//           instancePath: '/0/values/1',
//           schemaPath: '#/items/properties/values/items/type',
//           keyword: 'type',
//           params: { type: 'number' },
//           message: 'must be number',
//         },
//       ];
//
//       expect(
//         errorFormatter('The argument to upsert', validationErrors)
//       ).toEqual(
//         "The argument to upsert had type errors: item at index 0 of the 'values' array must be number, item at index 1 of the 'values' array must be number."
//       );
//     });
//   });
//
//   test('handles Never conditions', () => {
//     // await client.index('jen3').query({ topK: 3, vector: [0.5, 0.5, 0.5], sparseVector: { indices: [0, 1], values: [0.1, 0.25]}, id: '1' })
//     const validationErrors = [
//       {
//         instancePath: '/vector',
//         schemaPath: '#/anyOf/0/properties/vector/not',
//         keyword: 'not',
//         params: {},
//         message: 'must NOT be valid',
//       },
//       {
//         instancePath: '/id',
//         schemaPath: '#/anyOf/1/properties/id/not',
//         keyword: 'not',
//         params: {},
//         message: 'must NOT be valid',
//       },
//       {
//         instancePath: '',
//         schemaPath: '#/anyOf',
//         keyword: 'anyOf',
//         params: {},
//         message: 'must match a schema in anyOf',
//       },
//     ];
//
//     expect(errorFormatter('The argument to query', validationErrors)).toEqual(
//       'The argument to query accepts multiple types. Either 1) must not have property: vector. 2) must not have property: id.'
//     );
//   });
// });
