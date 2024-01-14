import { normalizeUrl } from '../normalizeUrl';

describe('normalizeUrl', () => {
  test('empty string and undefined return undefined', () => {
    expect(normalizeUrl('')).toBe(undefined);
    expect(normalizeUrl('   ')).toBe(undefined);
    expect(normalizeUrl()).toBe(undefined);
  });

  test('adds https:// to url if no protocol present', () => {
    expect(normalizeUrl('index-name-abcdef.svc.pinecone.io')).toBe(
      'https://index-name-abcdef.svc.pinecone.io'
    );
  });

  test('keeps http:// protocol if present', () => {
    expect(normalizeUrl('http://index-name-abcdef.svc.pinecone.io')).toBe(
      'http://index-name-abcdef.svc.pinecone.io'
    );
  });

  test('keeps https:// protocol if present', () => {
    expect(normalizeUrl('https://index-name-abcdef.svc.pinecone.io')).toBe(
      'https://index-name-abcdef.svc.pinecone.io'
    );
  });
});
