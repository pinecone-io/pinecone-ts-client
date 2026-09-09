import { assertRequestPathIsAddressable } from '../requestPath';
import { PineconeArgumentError } from '../../errors';

const HOST = 'https://idx-abc.svc.pinecone.io';

describe('assertRequestPathIsAddressable', () => {
  test.each([
    ['a single dot', `${HOST}/namespaces/.`],
    ['a double dot', `${HOST}/namespaces/..`],
    ['a percent-encoded dot', `${HOST}/namespaces/%2e`],
    ['a percent-encoded double dot', `${HOST}/namespaces/%2E%2E`],
    ['a mixed-spelling double dot', `${HOST}/namespaces/.%2e`],
    ['a dot segment in the middle', `${HOST}/files/../operations/op-1`],
    ['a dot segment before a query string', `${HOST}/namespaces/..?limit=10`],
  ])('rejects %s', (_case, url) => {
    expect(() => assertRequestPathIsAddressable(url)).toThrow(
      PineconeArgumentError,
    );
  });

  test.each([
    ['a plain identifier', `${HOST}/namespaces/ns-1`],
    ['dots inside a segment', `${HOST}/namespaces/a.b`],
    ['a segment of three dots', `${HOST}/namespaces/...`],
    ['an encoded slash', `${HOST}/namespaces/a%2Fb`],
    ['a doubly-encoded dot segment', `${HOST}/namespaces/%252e%252e`],
    ['a dot segment in the query string', `${HOST}/namespaces?filter=../..`],
    ['a dot segment in the fragment', `${HOST}/namespaces#/..`],
    ['no path at all', HOST],
  ])('accepts %s', (_case, url) => {
    expect(() => assertRequestPathIsAddressable(url)).not.toThrow();
  });

  test('the message names the segment and where the request would land', () => {
    expect(() =>
      assertRequestPathIsAddressable(`${HOST}/namespaces/..`),
    ).toThrow(/"\.\."/);
    expect(() =>
      assertRequestPathIsAddressable(`${HOST}/namespaces/..`),
    ).toThrow(/would reach "\/"/);
    expect(() =>
      assertRequestPathIsAddressable(`${HOST}/namespaces/.`),
    ).toThrow(/would reach "\/namespaces\/"/);
  });

  test('every accepted path survives URL resolution unchanged', () => {
    for (const path of [
      '/namespaces/ns-1',
      '/namespaces/a.b',
      '/namespaces/...',
      '/namespaces/a%2Fb',
      '/namespaces/%252e%252e',
    ]) {
      expect(new URL(HOST + path).pathname).toBe(path);
    }
  });
});
