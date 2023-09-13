import * as os from 'os';

export const getOSInfo = () => {
  // If available, capture information about the OS
  if (os && os.release && os.platform && os.arch) {
    const platform = os.platform();
    const platformVersion = os.release();
    const arch = os.arch();
    return `${platform} ${platformVersion}, ${arch}`;
  }
};
