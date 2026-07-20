import { config } from 'dotenv';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ['PINECONE_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
