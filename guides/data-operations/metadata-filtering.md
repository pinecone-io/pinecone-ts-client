# Metadata Filtering

Metadata filtering allows you to narrow your query results to only vectors that match specific metadata criteria. This is useful for implementing features like filtering by category, date range, user permissions, and more.

For more information, see [Filter by metadata](https://docs.pinecone.io/guides/search/filter-by-metadata).

## Filter operators

Pinecone supports the following filter operators:

- `$eq` - Equal to (number, string, boolean)
- `$ne` - Not equal to (number, string, boolean)
- `$gt` - Greater than (number)
- `$gte` - Greater than or equal to (number)
- `$lt` - Less than (number)
- `$lte` - Less than or equal to (number)
- `$in` - In array (string, number)
- `$nin` - Not in array (string, number)

## Basic filtering examples

### Equality filter

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    genre: { $eq: 'drama' },
  },
});
```

### Range filter

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    year: { $gte: 2000, $lte: 2010 },
  },
});
```

### Array membership filter

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    genre: { $in: ['comedy', 'documentary', 'drama'] },
  },
});
```

## Combining filters

### AND conditions

By default, multiple filter conditions are combined with AND:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    genre: { $eq: 'drama' },
    year: { $gte: 2000 },
    rating: { $gte: 7.0 },
  },
});
```

You can also explicitly use `$and`:

```typescript
const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    $and: [
      { genre: { $eq: 'drama' } },
      { year: { $gte: 2000 } },
      { rating: { $gte: 7.0 } },
    ],
  },
});
```

### OR conditions

Use `$or` to match vectors that satisfy any of multiple conditions:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    $or: [
      { genre: { $eq: 'comedy' } },
      { genre: { $eq: 'drama' } },
      { rating: { $gte: 8.5 } },
    ],
  },
});
```

## Complex filter examples

### Nested conditions

You can nest `$and` and `$or` operators to create complex filters:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    $and: [
      {
        $or: [{ genre: { $eq: 'comedy' } }, { genre: { $eq: 'drama' } }],
      },
      { year: { $gte: 2000 } },
      { rating: { $gte: 7.0 } },
    ],
  },
});
```

### Multiple field types

Combine different field types and operators:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index({ name: 'my-index' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    category: { $in: ['electronics', 'computers'] },
    price: { $gte: 100, $lte: 500 },
    inStock: { $eq: true },
    brand: { $ne: 'generic' },
  },
});
```

## Type-safe filtering with TypeScript

When you use typed metadata, TypeScript will help you construct valid filters:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

type MovieMetadata = {
  genre: 'comedy' | 'horror' | 'drama' | 'action';
  year: number;
  rating: number;
  inTheaters: boolean;
};

const index = pc.index<MovieMetadata>({ name: 'movies' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  filter: {
    genre: { $eq: 'drama' },
    year: { $gte: 2020 },
    // @ts-expect-error - TypeScript will catch invalid field names
    invalid_field: { $eq: 'value' },
  },
});
```

## Performance considerations

1. **Index metadata fields**: For serverless indexes, use metadata schema configuration to index only the fields you'll filter on
2. **Pod-based indexes**: Configure `metadataConfig` with `indexed` fields for high-cardinality metadata
3. **Selective filtering**: More selective filters (fewer matching vectors) generally perform better
4. **Avoid negation**: Filters like `$ne` and `$nin` may be less efficient than positive filters

For more details on metadata configuration, see:
- [Serverless metadata schema](../index-management/serverless-indexes.md#metadata-schema-configuration)
- [Pod metadata configuration](../index-management/pod-indexes.md#optional-spec-configurations-when-creating-pod-indexes)
