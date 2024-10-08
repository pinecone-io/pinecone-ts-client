// pages/index.tsx

import { GetServerSideProps } from 'next';
import { IndexModel } from '@pinecone-database/pinecone';

interface HomeProps {
  indexes: IndexModel[];  // Array of indexes passed as props
  error?: string;         // Error message if fetching fails
}

export default function Home({ indexes, error }: HomeProps) {
  if (error) {
    return <p>Error: {error}</p>;  // Display error message if present
  }

  return (
    <div>
      <h1>Pinecone Indexes</h1>
      {indexes.length > 0 ? (
        <ul>
          {indexes.map((index, idx) => (
            <li key={idx}>
              <strong>Name:</strong> {index.name} <br />
              <strong>Dimension:</strong> {index.dimension} <br />
              <strong>Metric:</strong> {index.metric} <br />
              <strong>Host:</strong> {index.host}
            </li>
          ))}
        </ul>
      ) : (
        <p>No indexes available</p>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch data from the API route
    const res = await fetch('http://localhost:3000/api/getIndexes');
    const result = await res.json();

    if (result.error) {
      return { props: { error: result.error, indexes: [] } };
    }

    // Access the nested indexes array
    return { props: { indexes: result.indexes.indexes } };

  } catch (error) {
    // Handle any network or unexpected errors
    return { props: { error: 'Failed to fetch indexes' } };
  }
};
