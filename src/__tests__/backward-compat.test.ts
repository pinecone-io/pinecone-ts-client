import { Pinecone } from '../pinecone';

describe('Backward compatibility', () => {
  const pc = new Pinecone({ apiKey: 'test-key' });

  describe('index method', () => {
    test('supports new options object API', () => {
      const index1 = pc.index({ name: 'test-index' });
      expect(index1).toBeDefined();

      const index2 = pc.index({ name: 'test-index', namespace: 'ns1' });
      expect(index2).toBeDefined();

      const index3 = pc.index({ name: 'test-index', host: 'https://test.io' });
      expect(index3).toBeDefined();

      const index4 = pc.index({
        name: 'test-index',
        additionalHeaders: { 'x-custom': 'value' },
      });
      expect(index4).toBeDefined();
    });

    test('supports legacy string-based API', () => {
      const index1 = pc.index('test-index');
      expect(index1).toBeDefined();

      const index2 = pc.index('test-index', 'https://test.io');
      expect(index2).toBeDefined();

      const index3 = pc.index('test-index', 'https://test.io', {
        'x-custom': 'value',
      });
      expect(index3).toBeDefined();
    });
  });

  describe('Index method (capitalized alias)', () => {
    test('supports new options object API', () => {
      const index1 = pc.Index({ name: 'test-index' });
      expect(index1).toBeDefined();

      const index2 = pc.Index({ name: 'test-index', namespace: 'ns1' });
      expect(index2).toBeDefined();
    });

    test('supports legacy string-based API', () => {
      const index1 = pc.Index('test-index');
      expect(index1).toBeDefined();

      const index2 = pc.Index('test-index', 'https://test.io');
      expect(index2).toBeDefined();

      const index3 = pc.Index('test-index', 'https://test.io', {
        'x-custom': 'value',
      });
      expect(index3).toBeDefined();
    });
  });

  describe('assistant method', () => {
    test('supports new options object API', () => {
      const assistant1 = pc.assistant({ name: 'test-assistant' });
      expect(assistant1).toBeDefined();

      const assistant2 = pc.assistant({
        name: 'test-assistant',
        host: 'https://test.io',
      });
      expect(assistant2).toBeDefined();
    });

    test('supports legacy string-based API', () => {
      const assistant1 = pc.assistant('test-assistant');
      expect(assistant1).toBeDefined();

      const assistant2 = pc.assistant('test-assistant', 'https://test.io');
      expect(assistant2).toBeDefined();
    });
  });

  describe('Assistant method (capitalized alias)', () => {
    test('supports new options object API', () => {
      const assistant1 = pc.Assistant({ name: 'test-assistant' });
      expect(assistant1).toBeDefined();
    });

    test('supports legacy string-based API', () => {
      const assistant1 = pc.Assistant('test-assistant');
      expect(assistant1).toBeDefined();

      const assistant2 = pc.Assistant('test-assistant', 'https://test.io');
      expect(assistant2).toBeDefined();
    });
  });
});
