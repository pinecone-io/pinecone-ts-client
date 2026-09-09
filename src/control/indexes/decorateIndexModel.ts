import type { IndexModel, IndexModelData, IndexList } from './listIndexes';
import type { Derived } from './legacyAccessors';
import {
  deriveDimension,
  deriveMetric,
  deriveVectorType,
  deriveSpec,
  deriveEmbed,
  deriveLegacyReadCapacity,
} from './legacyAccessors';
import { PineconeIndexPropertyError } from '../../errors/indexProperty';

function read<T>(result: Derived<T>): T | undefined {
  if (result.outcome === 'error')
    throw new PineconeIndexPropertyError(result.failure);
  return result.outcome === 'value' ? result.value : undefined;
}
/** Install lazy, non-enumerable legacy accessors on a plain API response. */
export function decorateIndexModel(model: IndexModelData): IndexModel {
  const getters = {
    dimension: () => read(deriveDimension(model)),
    metric: () => read(deriveMetric(model)),
    vectorType: () => read(deriveVectorType(model)),
    embed: () => read(deriveEmbed(model)),
    spec: () => {
      const spec = read(deriveSpec(model))!;
      const variant = spec.serverless ?? spec.byoc;
      if (variant && !model.readCapacity)
        Object.defineProperty(variant, 'readCapacity', {
          configurable: true,
          enumerable: false,
          get: () => read(deriveLegacyReadCapacity(model)),
        });
      return spec;
    },
  };
  for (const [property, get] of Object.entries(getters)) {
    // Preserve already-decorated objects, including a cached response instance.
    if (!Object.getOwnPropertyDescriptor(model, property)?.get)
      Object.defineProperty(model, property, {
        configurable: true,
        enumerable: false,
        get,
      });
  }
  return model as IndexModel;
}
/** Decorate every index independently without changing the list envelope. */
export function decorateIndexList(list: {
  indexes?: IndexModelData[];
}): IndexList {
  list.indexes?.forEach(decorateIndexModel);
  return list as IndexList;
}
