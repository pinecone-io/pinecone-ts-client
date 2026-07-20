// `EdgeRuntime` is a global injected by the Vercel Edge Runtime. We declare it
// locally rather than loading @edge-runtime/types into the global `types`,
// because that package declares a `URLPattern` global that collides with the
// one @types/node ships (TS2451).
declare const EdgeRuntime: string | undefined;

export const isEdge = () => {
  // This is the recommended way to detect
  // running in the Edge Runtime according
  // to Vercel docs.
  return typeof EdgeRuntime === 'string';
};

export const isBrowser = () => {
  return typeof window !== 'undefined';
};
