export function normalizeUrl(url?: string): string | undefined {
  if (!url || url.trim().length === 0) {
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }

  return url;
}
