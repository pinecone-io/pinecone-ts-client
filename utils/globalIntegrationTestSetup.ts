import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['PINECONE_API_KEY', 'PINECONE_ENVIRONMENT'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
