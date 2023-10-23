export const debugLog = (str: string) => {
  if (typeof process !== 'undefined' && process && process.env && process.env.PINECONE_DEBUG) {
    console.log(str);
  }
};
