import { Pinecone } from '../../pinecone';
import { AssistantDataPlane } from '../../assistant/data';

let pinecone: Pinecone;
let assistant: AssistantDataPlane;
let assistantName: string;
let file: string;
let fileId: string;

if (!process.env.ASSISTANT_NAME) {
  throw new Error('ASSISTANT_NAME environment variable is not set');
} else {
  assistantName = process.env.ASSISTANT_NAME;
}

if (!process.env.TEST_FILE) {
  throw new Error('TEST_FILE environment variable is not set');
} else {
  file = process.env.TEST_FILE;
}

beforeAll(async () => {
  pinecone = new Pinecone();
  assistant = pinecone.Assistant(assistantName);
  const files = await assistant.listFiles();
  if (files.files) {
    fileId = files.files.map((f) => f.id)[0];
  }
});

describe('Describe file happy path', () => {
  test('Describe file', async () => {
    const response = await assistant.describeFile({
      fileId: fileId,
    });
    expect(response).toBeDefined();
    expect(response.status).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.metadata).toBeDefined();
    if (response.metadata) {
      expect(response.metadata['key']).toBeDefined();
      expect(response.metadata['key']).toEqual('valueOne');
      expect(response.metadata['keyTwo']).toBeDefined();
      expect(response.metadata['keyTwo']).toEqual('valueTwo');
    }
  });
});

// describe('Describe file error paths', () => {
//   test('Describe with nonexistent fileId', async () => {
//     const throwError = async () => {
//       await assistant.describeFile({
//         fileId: 'nonexistent-file-id'
//       });
//     };
//     await expect(throwError()).rejects.toThrow(/404/);
//   });
//
//   test('Describe with empty fileId', async () => {
//     const throwError = async () => {
//       await assistant.describeFile({
//         fileId: ''
//       });
//     };
//     await expect(throwError()).rejects.toThrow();
//   });
//
//   test('Describe file with nonexistent assistant', async () => {
//     const throwError = async () => {
//       await pinecone.Assistant('nonexistent').describeFile({
//         fileId: fileId
//       });
//     };
//     await expect(throwError()).rejects.toThrow(/404/);
//   });
// });
