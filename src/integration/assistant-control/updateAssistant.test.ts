import { Pinecone } from '../../pinecone';
import { randomString } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('updateAssistant inplace updates, happy path', () => {
  test('simple update', async () => {
    const assistantName = randomString(5);
    await pinecone.createAssistant({
      name: assistantName,
      instructions: 'test-instructions',
      metadata: { key: 'value', keyTwo: 'valueTwo' },
      region: 'us',
    });

    await pinecone.updateAssistant(assistantName, {
      instructions: 'new-instructions',
      metadata: { key: 'newValue', keyTwo: 'newValueTwo' },
    });

    const description = await pinecone.describeAssistant(assistantName);
    expect(description.instructions).toEqual('new-instructions');
    expect(description.metadata).toEqual({
      key: 'newValue',
      keyTwo: 'newValueTwo',
    });

    await pinecone.deleteAssistant(assistantName);
  });

  test('updateAssistant with new metadata key:value pair', async () => {
    const assistantName = randomString(5);
    await pinecone.createAssistant({
      name: assistantName,
      metadata: { key: 'value', keyTwo: 'valueTwo' },
    });

    await pinecone.updateAssistant(assistantName, {
      metadata: { keyThree: 'valueThree' },
    });

    const description = await pinecone.describeAssistant(assistantName);
    expect(description.metadata).toEqual({ keyThree: 'valueThree' });

    await pinecone.deleteAssistant(assistantName);
  });
});

describe('updateAssistant error paths', () => {
  test('Update non-existent assistant', async () => {
    await expect(
      pinecone.updateAssistant('non-existent-assistant', {})
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
