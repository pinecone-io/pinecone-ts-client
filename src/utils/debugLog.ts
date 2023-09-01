export const debugLog = (str: string) => {
  if (process && process.env && process.env.PINECONE_DEBUG) {
    console.log(str);
  }
};
