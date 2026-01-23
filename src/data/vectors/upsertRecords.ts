import { VectorOperationsProvider } from './vectorOperationsProvider';
import {
  IntegratedRecord,
  PineconeConfiguration,
  RecordMetadata,
} from './types';
import { handleApiError, PineconeArgumentError } from '../../errors';
import { buildUserAgent, getFetch } from '../../utils';
import {
  ResponseError,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';

export class UpsertRecordsCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  config: PineconeConfiguration;
  namespace: string;

  constructor(
    apiProvider: VectorOperationsProvider,
    namespace: string,
    config: PineconeConfiguration
  ) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
    this.config = config;
  }

  validator = (records: Array<IntegratedRecord<T>>) => {
    for (const record of records) {
      if (!record.id && !record._id) {
        throw new PineconeArgumentError(
          'Every record must include an `id` or `_id` property in order to upsert.'
        );
      }
    }
  };

  async run(records: Array<IntegratedRecord<T>>): Promise<void> {
    const fetch = getFetch(this.config);
    this.validator(records);

    const hostUrl = await this.apiProvider.provideHostUrl();
    const upsertRecordsUrl = `${hostUrl}/records/namespaces/${this.namespace}/upsert`;

    const requestHeaders = {
      'Api-Key': this.config.apiKey,
      'User-Agent': buildUserAgent(this.config),
      'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
    };

    // Note: This operation uses direct fetch() with NDJSON format,
    // Retries are handled by the wrapped fetch from getFetch()
    const response = await fetch(upsertRecordsUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: toNdJson(records),
    });

    if (response.ok) {
      return;
    } else {
      const err = await handleApiError(
        new ResponseError(response, 'Response returned an error'),
        undefined,
        upsertRecordsUrl
      );
      throw err;
    }
  }
}

function toNdJson(data: Array<IntegratedRecord>): string {
  return data.map((record) => JSON.stringify(record)).join('\n');
}
