import { IndexModelFromJSON } from '../../../pinecone-generated-ts-fetch/db_control/models/IndexModel';
import { decorateIndexModel } from '../decorateIndexModel';
import { fixtures } from './fixtures/indexModels';

describe('legacy accessors preserve plain-object interoperability', () => {
  const plain = fixtures.fullTextOnly;
  const decorated = decorateIndexModel(structuredClone(plain));
  test('JSON serialization does not invoke throwing accessors', () =>
    expect(JSON.stringify(decorated)).toBe(JSON.stringify(plain)));
  test('spread and Object.assign copy only the API data', () => {
    expect({ ...decorated }).toStrictEqual(plain);
    expect(Object.assign({}, decorated)).toStrictEqual(plain);
    expect('dimension' in { ...decorated }).toBe(false);
  });
  test('structured clone does not invoke getters', () =>
    expect(structuredClone(decorated)).toStrictEqual(plain));
  test('enumeration skips getters while feature detection finds them', () => {
    expect(Object.keys(decorated)).toEqual(Object.keys(plain));
    expect('dimension' in decorated).toBe(true);
    expect(
      Object.getOwnPropertyDescriptor(decorated, 'dimension'),
    ).toMatchObject({ enumerable: false, configurable: true, set: undefined });
  });
  test('Jest equality retains the original prototype and enumerable keys', () => {
    expect(decorated).toEqual(plain);
    expect(decorated).toStrictEqual(plain);
  });
  test('unknown wire variants fail in the generated deserializer before decoration', () => {
    const wire = {
      name: 'index',
      status: { state: 'Ready', ready: true },
      deployment: {
        deployment_type: 'managed',
        cloud: 'aws',
        region: 'us-east-1',
      },
      schema: { fields: { unknown: { type: 'future' } } },
    };
    expect(() => IndexModelFromJSON(wire)).toThrow('No variant');
    expect(() =>
      IndexModelFromJSON({
        ...wire,
        schema: { fields: {} },
        deployment: { deployment_type: 'future' },
      }),
    ).toThrow('No variant');
  });
});
