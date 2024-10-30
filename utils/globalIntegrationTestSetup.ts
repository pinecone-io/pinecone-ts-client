import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_OPTIONS = '--no-restricted-code-eval';

const requiredEnvVars = ['PINECONE_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
