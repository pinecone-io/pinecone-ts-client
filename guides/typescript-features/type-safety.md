# Type Safety

The Pinecone TypeScript SDK provides full type safety through generic type parameters and TypeScript interfaces. This guide shows how to leverage these features for safer, more maintainable code.

## Generic metadata types

When storing metadata alongside your vectors, you can define a TypeScript interface and pass it as a type parameter to get compile-time type checking.

### Basic metadata typing

```typescript
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

// Define your metadata structure
type MovieMetadata = {
  title: string;
  runtime: number;
  genre: 'comedy' | 'horror' | 'drama' | 'action';
  releaseYear: number;
  director?: string; // Optional field
};

// Pass the type parameter when targeting the index
const index = pc.index<MovieMetadata>({ name: 'movies' });

// Now TypeScript will enforce the metadata structure
await index.upsert({
  records: [
    {
      id: 'movie1',
      values: [0.1, 0.2, 0.3, 0.4],
      metadata: {
        title: 'Gone with the Wind',
        runtime: 238,
        genre: 'drama',
        releaseYear: 1939,
      },
    },
  ],
});

// TypeScript will catch errors
await index.upsert({
  records: [
    {
      id: 'movie2',
      values: [0.2, 0.3, 0.4, 0.5],
      metadata: {
        title: 'The Matrix',
        runtime: 136,
        // @ts-expect-error - 'sci-fi' is not a valid genre
        genre: 'sci-fi',
        releaseYear: 1999,
      },
    },
  ],
});
```

### Type-safe queries

When you use typed metadata, TypeScript ensures your filters and returned metadata are type-safe:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

type MovieMetadata = {
  title: string;
  runtime: number;
  genre: 'comedy' | 'horror' | 'drama' | 'action';
  releaseYear: number;
};

const index = pc.index<MovieMetadata>({ name: 'movies' });

const results = await index.query({
  vector: [0.1, 0.2, 0.3, 0.4],
  topK: 10,
  includeMetadata: true,
  filter: {
    genre: { $eq: 'drama' },
    releaseYear: { $gte: 2000 },
  },
});

// TypeScript knows the metadata structure
results.matches.forEach((match) => {
  if (match.metadata) {
    // All these properties are properly typed
    const { title, runtime, genre, releaseYear } = match.metadata;
    console.log(`${title} (${releaseYear}) - ${genre} - ${runtime} min`);

    // TypeScript will catch invalid property access
    // @ts-expect-error - 'rating' doesn't exist in MovieMetadata
    console.log(match.metadata.rating);
  }
});
```

## Type-safe record definitions

You can define typed records for better code organization:

```typescript
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

type ProductMetadata = {
  name: string;
  category: string;
  price: number;
  inStock: boolean;
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index<ProductMetadata>({ name: 'products' });

// Define typed records
const products: PineconeRecord<ProductMetadata>[] = [
  {
    id: 'prod1',
    values: [0.1, 0.2, 0.3],
    metadata: {
      name: 'Laptop',
      category: 'electronics',
      price: 999.99,
      inStock: true,
    },
  },
  {
    id: 'prod2',
    values: [0.2, 0.3, 0.4],
    metadata: {
      name: 'Mouse',
      category: 'electronics',
      price: 29.99,
      inStock: false,
    },
  },
];

await index.upsert({ records: products });
```

## Typed filter construction

Use TypeScript's type system to build valid filters:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

type ProductMetadata = {
  category: string;
  price: number;
  inStock: boolean;
  tags: string[];
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index<ProductMetadata>({ name: 'products' });

// Type-safe filter
const filter = {
  category: { $in: ['electronics', 'computers'] },
  price: { $gte: 100, $lte: 500 },
  inStock: { $eq: true },
};

const results = await index.query({
  vector: [0.1, 0.2, 0.3],
  topK: 10,
  filter,
  includeMetadata: true,
});
```

## Complex metadata types

You can use nested objects and arrays in your metadata:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

type ArticleMetadata = {
  title: string;
  author: {
    name: string;
    email: string;
  };
  tags: string[];
  publishedAt: string; // ISO date string
  stats: {
    views: number;
    likes: number;
  };
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index<ArticleMetadata>({ name: 'articles' });

await index.upsert({
  records: [
    {
      id: 'article1',
      values: [0.1, 0.2, 0.3],
      metadata: {
        title: 'Introduction to Vector Databases',
        author: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        tags: ['database', 'vector', 'ai'],
        publishedAt: '2025-01-15T10:00:00Z',
        stats: {
          views: 1250,
          likes: 89,
        },
      },
    },
  ],
});

// Query with type-safe access
const results = await index.query({
  vector: [0.1, 0.2, 0.3],
  topK: 5,
  includeMetadata: true,
  filter: {
    'stats.views': { $gte: 1000 },
    tags: { $in: ['ai', 'ml'] },
  },
});

results.matches.forEach((match) => {
  if (match.metadata) {
    console.log(match.metadata.author.name); // Properly typed!
    console.log(match.metadata.stats.views);
  }
});
```

## Type guards and validation

Use TypeScript type guards to safely handle optional metadata:

```typescript
import { Pinecone, ScoredPineconeRecord } from '@pinecone-database/pinecone';

type MovieMetadata = {
  title: string;
  year: number;
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index<MovieMetadata>({ name: 'movies' });

function isValidMovie(
  record: ScoredPineconeRecord<MovieMetadata>,
): record is ScoredPineconeRecord<MovieMetadata> & { metadata: MovieMetadata } {
  return (
    record.metadata !== undefined &&
    typeof record.metadata.title === 'string' &&
    typeof record.metadata.year === 'number'
  );
}

const results = await index.query({
  vector: [0.1, 0.2, 0.3],
  topK: 10,
  includeMetadata: true,
});

results.matches.forEach((match) => {
  if (isValidMovie(match)) {
    // TypeScript knows metadata is defined here
    console.log(`${match.metadata.title} (${match.metadata.year})`);
  }
});
```

## Inference with types

When using integrated inference with `upsertRecords`, you can also define types for your records:

```typescript
import { Pinecone, IntegratedRecord } from '@pinecone-database/pinecone';

type ArticleRecord = {
  id: string;
  content: string; // Field to be embedded
  category: string;
  publishedAt: string;
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });

await pc.createIndexForModel({
  name: 'articles',
  cloud: 'aws',
  region: 'us-east-1',
  embed: {
    model: 'multilingual-e5-large',
    fieldMap: { text: 'content' },
  },
  waitUntilReady: true,
});

const index = pc.index({ name: 'articles' });

const articles: ArticleRecord[] = [
  {
    id: 'art1',
    content: 'Machine learning is transforming healthcare...',
    category: 'technology',
    publishedAt: '2025-01-15T10:00:00Z',
  },
];

await index.upsertRecords({ records: articles });
```

## Best practices

1. **Define metadata interfaces**: Create clear interfaces for your metadata structures
2. **Use union types**: For fields with limited values (like `genre`), use union types for better type safety
3. **Optional fields**: Mark optional fields with `?` to match your data model
4. **Type guards**: Use type guards when metadata might be undefined
5. **Reusable types**: Export metadata types for use across your application

## Common patterns

### Partial metadata updates

When updating metadata, you may want to use `Partial<>`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

type MovieMetadata = {
  title: string;
  runtime: number;
  genre: string;
  releaseYear: number;
};

const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
const index = pc.index<MovieMetadata>({ name: 'movies' });

// Update only specific fields
const partialUpdate: Partial<MovieMetadata> = {
  genre: 'thriller',
};

await index.update({
  id: 'movie1',
  setMetadata: partialUpdate,
});
```

### Type-safe helper functions

Create helper functions with proper typing:

```typescript
import { Pinecone, PineconeRecord, QueryResponse } from '@pinecone-database/pinecone';

type ProductMetadata = {
  name: string;
  price: number;
  category: string;
};

async function findSimilarProducts(
  query: number[],
  category: string,
  maxPrice: number,
): Promise<QueryResponse<ProductMetadata>> {
  const pc = new Pinecone({ apiKey: 'YOUR_API_KEY' });
  const index = pc.index<ProductMetadata>({ name: 'products' });

  return await index.query({
    vector: query,
    topK: 10,
    filter: {
      category: { $eq: category },
      price: { $lte: maxPrice },
    },
    includeMetadata: true,
  });
}

// Usage
const results = await findSimilarProducts([0.1, 0.2, 0.3], 'electronics', 500);
results.matches.forEach((match) => {
  if (match.metadata) {
    console.log(`${match.metadata.name}: $${match.metadata.price}`);
  }
});
```
