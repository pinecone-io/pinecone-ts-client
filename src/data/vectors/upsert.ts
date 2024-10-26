import { VectorOperationsProvider } from './vectorOperationsProvider';
import type { Vector } from '../../pinecone-generated-ts-fetch/db_data';
import {
  PineconeRecord,
  PineconeRecordsProperties,
  RecordMetadata,
} from './types';
import { PineconeArgumentError } from '../../errors';
import { ValidateProperties } from '../../utils/validateProperties';
import { RetryOnServerFailure, RetryOptions } from '../../utils/retries';

export class UpsertCommand<T extends RecordMetadata = RecordMetadata> {
  apiProvider: VectorOperationsProvider;
  namespace: string;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
  }

  validator = (records: Array<PineconeRecord<T>>) => {
    for (const record of records) {
      ValidateProperties(record, PineconeRecordsProperties);
    }
    if (records.length === 0) {
      throw new PineconeArgumentError(
        'Must pass in at least 1 record to upsert.'
      );
    }
    records.forEach((record) => {
      if (!record.id) {
        throw new PineconeArgumentError(
          'Every record must include an `id` property in order to upsert.'
        );
      }
      if (!record.values) {
        throw new PineconeArgumentError(
          'Every record must include a `values` property in order to upsert.'
        );
      }
    });
  };

  async run(
    records: Array<PineconeRecord<T>>,
    retry: true | false | undefined = true,
    retryOptions?: RetryOptions
  ): Promise<void> {
    this.validator(records);

    const api = await this.apiProvider.provide();

    // todo simplify
    if (retry) {
      if (retryOptions) {
        const retryWrapper = new RetryOnServerFailure(
          api.upsertVectors.bind(api),
          retryOptions
        );
        await retryWrapper.execute({
          upsertRequest: {
            vectors: records as Array<Vector>,
            namespace: this.namespace,
          },
        })
      } else {
        const retryWrapper = new RetryOnServerFailure(
          api.upsertVectors.bind(api)
        );
        console.log("UPSERT WITH RETRY: I'M HIT!")
        await retryWrapper.execute({
          upsertRequest: {
            vectors: records as Array<Vector>,
            namespace: this.namespace,
          },
        });
      }
    } else {
      console.log("UPSERT WITHOUT RETRY: I'M HIT!")
      await api.upsertVectors({
        upsertRequest: {
          vectors: records as Array<Vector>,
          namespace: this.namespace,
        },
      });
      return;
    }
  }
}
