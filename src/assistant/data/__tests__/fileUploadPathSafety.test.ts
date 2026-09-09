import { sendFileMultipart } from '../fileUpload';
import { PineconeArgumentError } from '../../../errors';
import { PineconeConfiguration } from '../../../data';

const config = { apiKey: 'test-api-key' } as PineconeConfiguration;
const HOST = 'https://prod-1-data.ke.pinecone.io/assistant';

describe('sendFileMultipart', () => {
  test.each([`${HOST}/files/..`, `${HOST}/files/my-assistant/.`])(
    'refuses to send to %p',
    async (url) => {
      await expect(
        sendFileMultipart('POST', url, { path: 'report.pdf' }, config),
      ).rejects.toThrow(PineconeArgumentError);
    },
  );
});
