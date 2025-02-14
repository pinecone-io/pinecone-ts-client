import { EmbeddingsList } from '../embeddingsList';
import {
  Embedding,
  EmbeddingsListUsage,
} from '../../pinecone-generated-ts-fetch/inference';

// TODO: add tests for sparse vector types

describe('EmbeddingsList', () => {
  let mockEmbeddings: Array<Embedding>;
  let mockUsage: EmbeddingsListUsage;
  let mockModel: string;
  let embeddingsList: EmbeddingsList;

  beforeAll(() => {
    mockEmbeddings = [
      { vectorType: 'dense', values: [1, 2, 3] },
      { vectorType: 'dense', values: [4, 5, 6] },
    ];
    mockUsage = { totalTokens: 3 };
    mockModel = 'someEmbeddingModel';
    embeddingsList = new EmbeddingsList(
      mockModel,
      'dense',
      mockEmbeddings,
      mockUsage
    );
  });

  test('Should initialize embeddingsList class correctly', () => {
    expect(embeddingsList).toBeInstanceOf(EmbeddingsList);
    expect(embeddingsList.model).toEqual(mockModel);
    expect(embeddingsList.data).toEqual(mockEmbeddings);
    expect(embeddingsList.usage).toEqual(mockUsage);
    expect(embeddingsList.data?.values).toEqual(mockEmbeddings.values);
  });

  test('Should return correct Embedding by index and by element', () => {
    expect(embeddingsList.get(0)).toEqual(mockEmbeddings[0]);

    const elementToFindIndexOf: Embedding = mockEmbeddings[0];
    expect(embeddingsList.indexOf(elementToFindIndexOf)).toEqual(0);
  });

  test('Should truncate output of values when necessary', () => {
    const manyValues = [1, 2, 3, 4, 5, 6, 7, 8];
    const truncatedManyValues =
      embeddingsList.truncateValuesForDisplay(manyValues);
    expect(truncatedManyValues).toEqual([1, 2, '...', 7, 8]);

    const fewValues = [1, 2];
    const truncatedFewValues =
      embeddingsList.truncateValuesForDisplay(fewValues);
    expect(truncatedFewValues).toEqual(fewValues);
  });
});

describe('truncateData', () => {
  let mockEmbeddings: Array<Embedding>;
  let mockUsage: EmbeddingsListUsage;
  let embeddingsList: EmbeddingsList;
  let mockModel: string;

  // todo: make this common to all tests in this file b/c it's redundant
  beforeAll(() => {
    mockEmbeddings = [
      { vectorType: 'dense', values: [1, 2, 3] },
      { vectorType: 'dense', values: [4, 5, 6] },
    ];
    mockUsage = { totalTokens: 3 };
    mockModel = 'someEmbeddingModel';
    embeddingsList = new EmbeddingsList(
      mockModel,
      'dense',
      mockEmbeddings,
      mockUsage
    );
  });

  // Mock the truncateValues method to avoid side effects
  beforeEach(() => {
    jest
      .spyOn(EmbeddingsList.prototype, 'truncateValuesForDisplay')
      .mockImplementation((values: number[]) => {
        if (!values || values.length <= 4) {
          return values ? values : [];
        }
        return [...values.slice(0, 2), '...', ...values.slice(-2)];
      });
  });

  test('Should truncate output of data object when appropriate', () => {
    const mockEmbeddingsWithoutTruncationExpected: Array<Embedding> = [
      { vectorType: 'dense', values: [1, 2, 3] },
      { vectorType: 'dense', values: [4, 5, 6] },
      { vectorType: 'dense', values: [7, 8, 9] },
    ];
    embeddingsList = new EmbeddingsList(
      mockModel,
      'dense',
      mockEmbeddingsWithoutTruncationExpected,
      mockUsage
    );

    const expectedTruncatedData = [
      { values: [1, 2, 3] },
      { values: [4, 5, 6] },
      { values: [7, 8, 9] },
    ];

    expect(embeddingsList['truncateDataForDisplay']()).toEqual(
      expectedTruncatedData
    );
  });

  test('should truncate data correctly when there are more than 5 embeddings', () => {
    const mockEmbeddingsWithTruncationExpected: Array<Embedding> = [
      { vectorType: 'dense', values: [1, 2, 3, 4, 5] },
      { vectorType: 'dense', values: [6, 7, 8, 9, 10] },
      { vectorType: 'dense', values: [11, 12, 13, 14, 15] },
      { vectorType: 'dense', values: [16, 17, 18, 19, 20] },
      { vectorType: 'dense', values: [21, 22, 23, 24, 25] },
      { vectorType: 'dense', values: [26, 27, 28, 29, 30] },
    ];
    embeddingsList = new EmbeddingsList(
      mockModel,
      'dense',
      mockEmbeddingsWithTruncationExpected,
      mockUsage
    );

    const expectedTruncatedData = [
      { values: [1, 2, '...', 4, 5] },
      { values: [6, 7, '...', 9, 10] },
      `... (2 more embeddings) ...`,
      { values: [21, 22, '...', 24, 25] },
      { values: [26, 27, '...', 29, 30] },
    ];

    expect(embeddingsList['truncateDataForDisplay']()).toEqual(
      expectedTruncatedData
    );
  });
});
