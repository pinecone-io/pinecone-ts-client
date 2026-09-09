import { Pinecone } from '../../pinecone';
import { cleanupResources, randomString } from '../test-helpers';
import { PineconeNotFoundError } from '../../errors';

let pinecone: Pinecone;
const assistantNames: string[] = [];
afterEach(async () => {
  await cleanupResources(pinecone, [], assistantNames.splice(0));
}, 60_000);

beforeAll(async () => {
  pinecone = new Pinecone();
});

describe('updateAssistant inplace updates, happy path', () => {
  test('simple update', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await pinecone.assistants.create({
      name: assistantName,
      instructions: 'test-instructions',
      metadata: { key: 'value', keyTwo: 'valueTwo' },
      region: 'us',
    });

    await pinecone.assistants.update({
      name: assistantName,
      instructions: 'new-instructions',
      metadata: { key: 'newValue', keyTwo: 'newValueTwo' },
    });

    const description = await pinecone.assistants.describe(assistantName);
    expect(description.instructions).toEqual('new-instructions');
    expect(description.metadata).toEqual({
      key: 'newValue',
      keyTwo: 'newValueTwo',
    });
  });

  test('updateAssistant with new metadata key:value pair', async () => {
    const assistantName = randomString(5);
    assistantNames.push(assistantName);
    await pinecone.assistants.create({
      name: assistantName,
      metadata: { key: 'value', keyTwo: 'valueTwo' },
    });

    await pinecone.assistants.update({
      name: assistantName,
      metadata: { keyThree: 'valueThree' },
    });

    const description = await pinecone.assistants.describe(assistantName);
    expect(description.metadata).toEqual({ keyThree: 'valueThree' });
  });
});

describe('updateAssistant error paths', () => {
  test('Update non-existent assistant', async () => {
    await expect(
      pinecone.assistants.update({ name: 'non-existent-assistant' }),
    ).rejects.toThrow(PineconeNotFoundError);
  });
});
