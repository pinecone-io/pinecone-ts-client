import * as fs from 'fs';
import * as os from 'os';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export const buildUserAgent = (isLegacy: boolean) => {
  // We always want to include the package name and version
  // along with the langauge name to help distinguish these
  // requests from those emitted by other clients
  const userAgentParts = [
    `${packageJson.name} v${packageJson.version}`,
    'lang=typescript',
  ];

  // If available, capture information about the OS
  if (os && os.release && os.platform && os.arch) {
    const platform = os.platform();
    const platformVersion = os.release();
    const arch = os.arch();
    userAgentParts.push(`${platform} ${platformVersion}, ${arch}`);
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
