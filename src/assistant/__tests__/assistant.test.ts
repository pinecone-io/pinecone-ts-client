import { Assistant } from '../index';
import { PineconeConfiguration } from '../../data';
import { PineconeArgumentError } from '../../errors';

describe('Assistant constructor validation', () => {
  const mockConfig = {
    apiKey: 'test-key',
  } as PineconeConfiguration;

  test('throws error when assistant name is empty string', () => {
    expect(() => {
      new Assistant({ name: '' }, mockConfig);
    }).toThrow(PineconeArgumentError);
    expect(() => {
      new Assistant({ name: '' }, mockConfig);
    }).toThrow('Assistant name is required and cannot be empty.');
  });

  test('throws error when assistant name is whitespace only', () => {
    expect(() => {
      new Assistant({ name: '   ' }, mockConfig);
    }).toThrow(PineconeArgumentError);
    expect(() => {
      new Assistant({ name: '   ' }, mockConfig);
    }).toThrow('Assistant name is required and cannot be empty.');
  });

  test('creates assistant successfully with valid name', () => {
    expect(() => {
      new Assistant({ name: 'valid-assistant-name' }, mockConfig);
    }).not.toThrow();
  });

  test('creates assistant successfully with valid name and host', () => {
    expect(() => {
      new Assistant(
        { name: 'valid-assistant-name', host: 'https://test-host.com' },
        mockConfig,
      );
    }).not.toThrow();
  });
});
