import { buildUserAgent } from '../user-agent';
import * as EnvironmentModule from '../environment';

describe('user-agent', () => {
  describe('buildUserAgent', () => {
    test('applies Edge Runtime when running in an edge environment', () => {
      jest.spyOn(EnvironmentModule, 'isEdge').mockReturnValue(true);
      const config = { apiKey: 'test-api-key' };
      const userAgent = buildUserAgent(config);

      expect(userAgent).toContain('Edge Runtime');
    });

    test('applies source_tag when provided via PineconeConfiguration', () => {
      const config = {
        apiKey: 'test-api-key',
        sourceTag: 'test source tag',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=test_source_tag');
    });

    test('applies caller_model when provided via PineconeConfiguration', () => {
      const config = {
        apiKey: 'test-api-key',
        callerModel: 'gpt-4',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model=gpt-4');
    });

    test('applies caller_model_provider when provided via PineconeConfiguration', () => {
      const config = {
        apiKey: 'test-api-key',
        callerModelProvider: 'openai',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model_provider=openai');
    });

    test('applies both caller_model and caller_model_provider when both provided', () => {
      const config = {
        apiKey: 'test-api-key',
        callerModel: 'claude-3-opus',
        callerModelProvider: 'anthropic',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model_provider=anthropic');
      expect(userAgent).toContain('caller_model=claude-3-opus');
    });

    test('applies all optional fields when provided', () => {
      const config = {
        apiKey: 'test-api-key',
        sourceTag: 'my app',
        callerModel: 'gpt-4',
        callerModelProvider: 'openai',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_app');
      expect(userAgent).toContain('caller_model=gpt-4');
      expect(userAgent).toContain('caller_model_provider=openai');
    });
  });

  describe('normalizeSourceTag', () => {
    test('normalizes variations of sourceTag', () => {
      const config = {
        apiKey: 'test-api-key',
        sourceTag: 'my source tag!!!',
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag');

      config.sourceTag = 'My Source Tag';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag');

      config.sourceTag = '   My   Source    Tag       123    ';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_123');

      config.sourceTag = '  MY SOURCE TAG     1234     ##### !!!!!!';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_1234');

      config.sourceTag = ' MY SOURCE TAG :1234-ABCD';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_:1234abcd');
    });
  });

  describe('normalizeCallerInfo', () => {
    test('normalizes caller model names', () => {
      let config = {
        apiKey: 'test-api-key',
        callerModel: 'GPT-4',
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model=gpt-4');

      config.callerModel = 'Claude 3 Opus';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model=claude_3_opus');

      config.callerModel = 'gpt-4-turbo-preview!!!';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model=gpt-4-turbo-preview');

      config.callerModel = '  gemini-1.5-pro  ';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model=gemini-1.5-pro');
    });

    test('normalizes caller model provider names', () => {
      let config = {
        apiKey: 'test-api-key',
        callerModelProvider: 'OpenAI',
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model_provider=openai');

      config.callerModelProvider = 'Anthropic!!!';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model_provider=anthropic');

      config.callerModelProvider = '  Google  AI  ';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller_model_provider=google_ai');
    });
  });
});
