import { Pinecone } from '../../pinecone';
import { randomString } from '../test-helpers';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('createAssistant happy path', () => {
  test('simple create', async () => {
    const assistantName = randomString(5);
    await pinecone.assistant.createAssistant({
      name: assistantName,
      instructions: 'test-instructions',
      metadata: { key: 'value', keyTwo: 'valueTwo' },
      region: 'us',
    });
    const description = await pinecone.assistant.getAssistant(assistantName);
    expect(description.name).toEqual(assistantName);
    expect(description.instructions).toEqual('test-instructions');
    expect(description.metadata).toEqual({ key: 'value', keyTwo: 'valueTwo' });

    await pinecone.assistant.deleteAssistant(assistantName);
  });
});

describe('createAssistant error paths', () => {
  test('createAssistant with too much metadata', async () => {
    const assistantName = randomString(5);
    const throwError = async () => {
      await pinecone.assistant.createAssistant({
        name: assistantName,
        metadata: { key: 'a'.repeat(1000000) },
      });
    };
    await expect(throwError()).rejects.toThrow('Metadata is too large');
  });

  test('createAssistant with invalid region', async () => {
    const assistantName = randomString(5);
    const throwError = async () => {
      await pinecone.assistant.createAssistant({
        name: assistantName,
        region: 'invalid-region',
      });
    };
    await expect(throwError()).rejects.toThrow(
      'Invalid region specified. Must be one of "us" or "eu"'
    );
  });

  test('createAssistant with empty assistant name', async () => {
    const assistantName = '';
    const throwError = async () => {
      await pinecone.assistant.createAssistant({
        name: assistantName,
      });
    };
    await expect(throwError()).rejects.toThrow('Invalid assistant name');
  });

  test('createAssistant with duplicate name', async () => {
    const assistantName = randomString(5);
    await pinecone.assistant.createAssistant({
      name: assistantName,
    });

    const throwError = async () => {
      await pinecone.assistant.createAssistant({
        name: assistantName,
      });
    };
    await expect(throwError()).rejects.toThrow();

    await pinecone.assistant.deleteAssistant(assistantName);
  });
});
