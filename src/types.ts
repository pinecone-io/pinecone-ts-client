export type ClientConfigurationInit = {
  apiKey: string;
  environment: string;
  projectId?: string;
};

export type ClientConfiguration = ClientConfigurationInit & {
  projectId: string;
};
