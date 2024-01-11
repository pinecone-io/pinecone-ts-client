import { isEdge } from './environment';
import * as packageInfo from '../version.json';

export const buildUserAgent = () => {
  // We always want to include the package name and version
  // along with the langauge name to help distinguish these
  // requests from those emitted by other clients
  const userAgentParts = [
    `${packageInfo.name} v${packageInfo.version}`,
    'lang=typescript',
  ];

  // If there's a release in packageInfo, append to the user agent
  if (packageInfo.release && packageInfo.release !== '') {
    userAgentParts.push(`release=${packageInfo.release}`);
  }

  if (isEdge()) {
    userAgentParts.push('Edge Runtime');
  }

  // If available, capture information about the Node.js version
  if (typeof process !== 'undefined' && process && process.version) {
    userAgentParts.push(`node ${process.version}`);
  }

  return userAgentParts.join('; ');
};
