import type { AssistantFileStatusEnum } from './types';

export const mapAssistantFileStatus = (
  status?: string
): AssistantFileStatusEnum | undefined => {
  if (!status) {
    return undefined;
  }
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'processing':
      return 'Processing';
    case 'available':
      return 'Available';
    case 'deleting':
      return 'Deleting';
    case 'processingfailed':
      return 'ProcessingFailed';
    default:
      return status as AssistantFileStatusEnum;
  }
};
