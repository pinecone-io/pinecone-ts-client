// // @ts-nocheck
//
// // Disabling typescript in this file because the entire point is to catch
// // cases where library callers (who may not be using typescript) pass
// // incorrect argument values.
//
// import { configureIndex } from '../configureIndex';
// import { PineconeArgumentError } from '../../errors';
// import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';
//
// describe('configureIndex argument validations', () => {
//   let MIA: ManageIndexesApi;
//   beforeEach(() => {
//     MIA = { configureIndex: jest.fn() };
//     jest.mock('../../pinecone-generated-ts-fetch/control', () => ({
//       IndexOperationsApi: MIA,
//     }));
//   });
//
//   describe('required configurations', () => {
//     test('should throw if index name is not provided', async () => {
//       const toThrow = async () => await configureIndex(MIA)();
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         'The first argument to configureIndex had type errors: argument must be string.'
//       );
//     });
//
//     test('should throw if index name is not a string', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)(1, { spec: { pod: { replicas: 10 } } });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         'The first argument to configureIndex had type errors: argument must be string.'
//       );
//     });
//
//     test('should throw if index name is empty string', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)('', { spec: { pod: { replicas: 2 } } });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         'The first argument to configureIndex had validation errors: argument must not be blank.'
//       );
//     });
//
//     test('should throw if spec or deletionProtection are not provided', async () => {
//       const toThrowSpec = async () =>
//         await configureIndex(MIA)('index-name', {});
//
//       expect(toThrowSpec).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrowSpec).rejects.toThrowError(
//         'The second argument to configureIndex should not be empty object. Please specify at least one property (spec, deletionProtection) to update.'
//       );
//     });
//
//     test('should throw if replicas is not a number', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)('index-name', {
//           spec: { pod: { replicas: '10' } },
//         });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         "The second argument to configureIndex had type errors: property 'spec/properties/pod/properties/replicas' must be integer."
//       );
//     });
//
//     test('should throw if podType is not a string', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)('index-name', {
//           spec: { pod: { podType: 10.5 } },
//         });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         "The second argument to configureIndex had type errors: property 'spec/properties/pod/properties/podType' must be string."
//       );
//     });
//
//     test('should throw if replicas is not a positive integer', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)('index-name', {
//           spec: { pod: { replicas: 0 } },
//         });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         "The second argument to configureIndex had validation errors: property 'spec/properties/pod/properties/replicas' must be >= 1."
//       );
//     });
//
//     test('should throw if deletionProtection is an empty string', async () => {
//       const toThrow = async () =>
//         await configureIndex(MIA)('index-name', { deletionProtection: '' });
//
//       expect(toThrow).rejects.toThrowError(PineconeArgumentError);
//       expect(toThrow).rejects.toThrowError(
//         "The second argument to configureIndex had validation errors: property 'deletionProtection' must not be blank."
//       );
//     });
//   });
// });
