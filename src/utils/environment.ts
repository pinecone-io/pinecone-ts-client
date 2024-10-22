export const isEdge = () => {
  // This is the recommended way to detect
  // running in the Edge Runtime according
  // to Vercel docs.
  return typeof EdgeRuntime === 'string';
};

export const isBrowser = () => {
  return typeof window !== 'undefined';
};

export function isNextJs(): boolean {
  // Check if the SDK is running in a Next.js environment by detecting NEXT_RUNTIME
  return Boolean(process.env.NEXT_RUNTIME);
}
