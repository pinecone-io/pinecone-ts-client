/**
 * Demo Script: Optional Caller Configuration Parameter
 * 
 * This script demonstrates the new optional caller configuration feature
 * that allows users to pass information about the LLM model and provider
 * being used with the Pinecone TypeScript SDK.
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Example 1: Using with OpenAI GPT-4
console.log('Example 1: OpenAI GPT-4');
const pcOpenAI = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'gpt-4',
  callerModelProvider: 'openai'
});
// User-Agent will include: caller_model_provider=openai; caller_model=gpt-4

// Example 2: Using with Anthropic Claude
console.log('Example 2: Anthropic Claude');
const pcAnthropic = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'claude-3-opus',
  callerModelProvider: 'anthropic'
});
// User-Agent will include: caller_model_provider=anthropic; caller_model=claude-3-opus

// Example 3: Using with Google Gemini
console.log('Example 3: Google Gemini');
const pcGoogle = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'gemini-1.5-pro',
  callerModelProvider: 'google'
});
// User-Agent will include: caller_model_provider=google; caller_model=gemini-1.5-pro

// Example 4: Combined with existing sourceTag
console.log('Example 4: Combined with sourceTag');
const pcCombined = new Pinecone({
  apiKey: 'your-api-key',
  sourceTag: 'my-rag-application',
  callerModel: 'gpt-4-turbo',
  callerModelProvider: 'openai',
  maxRetries: 5
});
// User-Agent will include: source_tag=my-rag-application; caller_model_provider=openai; caller_model=gpt-4-turbo

// Example 5: Backward compatible - still works without caller config
console.log('Example 5: Without caller configuration (backward compatible)');
const pcLegacy = new Pinecone({
  apiKey: 'your-api-key'
});
// User-Agent will NOT include caller information (works as before)

// Example 6: Normalization examples
console.log('Example 6: Automatic normalization');
const pcNormalized = new Pinecone({
  apiKey: 'your-api-key',
  callerModel: 'Claude 3 Opus!!!',  // Will be normalized to: claude_3_opus
  callerModelProvider: '  OpenAI  ' // Will be normalized to: openai
});

console.log('All examples configured successfully!');
console.log('The caller information will be automatically included in the User-Agent header for all API requests.');
