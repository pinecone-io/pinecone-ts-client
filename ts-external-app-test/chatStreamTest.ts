import { Pinecone } from '../dist/index';

const client = new Pinecone();

const newStream = await client
  .assistant('test-chat')
  .chatStream({ messages: ['tell me about API design'] });

(async () => {
  for await (const chunk of newStream) {
    console.log(JSON.stringify(chunk));
  }
})();

(async () => {
  for await (const chunk of newStream) {
    console.log(JSON.stringify(chunk));
  }
})();
