import { isEdge } from './environment';
import * as packageInfo from '../version.json';

export const buildUserAgent = (isLegacy: boolean) => {
  // We always want to include the package name and version
  // along with the langauge name to help distinguish these
  // requests from those emitted by other clients
  const userAgentParts = [
    `${packageInfo.name} v${packageInfo.version}`,
    'lang=typescript',
  ];

  if (isEdge()) {
    userAgentParts.push('Edge Runtime');
  }

  // If available, capture information about the Node.js version
  if (process && process.version) {
    userAgentParts.push(`node ${process.version}`);
  }

  // Use this flag to identify whether they are using the v0 legacy
  // client export called PineconeClient
  userAgentParts.push(`legacyExport=${isLegacy}`);

  return userAgentParts.join('; ');
};
