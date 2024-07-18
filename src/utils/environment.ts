export const isEdge = () => {
  // This is the recommended way to detect
  // running in the Edge Runtime according
  // to Vercel docs.
  return typeof EdgeRuntime === 'string';
};

export const isBrowser = () => {
  return typeof window !== 'undefined';
};
