import { Pinecone } from '../dist/index';

const client = new Pinecone();

const newStream = await client
  .assistant('test-chat-stream')
  .chatCompletionsStream({ messages: ['tell me about API design'] });

(async () => {
  // print entire chunks
  for await (const chunk of newStream) {
    if (chunk.choices.length > 0 && chunk.choices[0].delta.content) {
      process.stdout.write(chunk.choices[0].delta.content);
    }
  }

  // // print only content
  // for await (const chunk of newStream) {
  //   if (chunk.type === 'content_chunk' && chunk.delta?.content) {
  //     process.stdout.write(chunk.delta.content);
  //   }
  // }
})();
