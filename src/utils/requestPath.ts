import { PineconeArgumentError } from '../errors';

/**
 * True for a segment that URL resolution removes rather than sends.
 *
 * `encodeURIComponent` leaves `.` untouched, so an identifier of `.` or `..`
 * survives encoding as a whole path segment, and WHATWG URL parsing — which
 * `fetch` applies to every request — then strips it. Percent-encoding does not
 * help: the spec matches `%2e` case-insensitively as a dot.
 *
 * @see https://url.spec.whatwg.org/#double-dot-path-segment
 */
const isDotSegment = (segment: string): boolean => {
  const normalized = segment.toLowerCase();
  return (
    normalized === '.' ||
    normalized === '%2e' ||
    normalized === '..' ||
    normalized === '.%2e' ||
    normalized === '%2e.' ||
    normalized === '%2e%2e'
  );
};

/**
 * The path of an absolute URL exactly as written, before normalization.
 *
 * `new URL(url).pathname` cannot serve here: it reports the path the request
 * will reach, which is the value under suspicion.
 */
const rawPathOf = (url: string): string => {
  const schemeSeparator = url.indexOf('://');
  const authorityStart = schemeSeparator === -1 ? 0 : schemeSeparator + 3;

  let pathEnd = url.length;
  for (const delimiter of ['?', '#']) {
    const index = url.indexOf(delimiter, authorityStart);
    if (index !== -1 && index < pathEnd) {
      pathEnd = index;
    }
  }

  const pathStart = url.indexOf('/', authorityStart);
  if (pathStart === -1 || pathStart >= pathEnd) {
    return '';
  }
  return url.slice(pathStart, pathEnd);
};

const resolvedPathOf = (url: string): string | undefined => {
  try {
    return new URL(url).pathname;
  } catch {
    return undefined;
  }
};

/**
 * Throws if a request URL would not reach the resource its path names.
 *
 * Call this on a fully built request URL, immediately before handing it to
 * `fetch`: that is the last point at which the path the caller asked for is
 * still visible.
 *
 * @param url - The absolute request URL, including any query string.
 * @throws PineconeArgumentError when a path segment would be removed by URL
 * resolution, which happens when a resource identifier is `.`, `..`, or a
 * percent-encoded spelling of either.
 *
 * @internal
 */
export const assertRequestPathIsAddressable = (url: string): void => {
  const requestedPath = rawPathOf(url);
  if (requestedPath === '') {
    return;
  }

  const dotSegment = requestedPath.split('/').find(isDotSegment);
  if (dotSegment === undefined) {
    return;
  }

  const resolvedPath = resolvedPathOf(url);
  const destination = resolvedPath
    ? ` The request would reach "${resolvedPath}" instead.`
    : '';

  throw new PineconeArgumentError(
    `The request path "${requestedPath}" contains the segment "${dotSegment}", which URL resolution removes before the request is sent.${destination} ` +
      `Pass a resource identifier that is not "." or ".."; percent-encoding does not make either safe.`,
  );
};
