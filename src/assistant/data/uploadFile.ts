// import {
//   type AssistantFileModel,
//   X_PINECONE_API_VERSION,
// } from '../../pinecone-generated-ts-fetch/assistant_data';
// // import axios from 'axios';
// // import FormData from 'form-data';
// import fs from 'fs';
// import { PineconeConfiguration } from '../../data';
// import { buildUserAgent } from '../../utils';
// import { AssistantHostSingleton } from '../assistantHostSingleton';

// /**
//  * The `UploadFile` interface describes the file path for uploading a file to an Assistant and optional metadata.
//  */
// export interface UploadFile {
//   /**
//    * The (local) path to the file to upload.
//    */
//   path: string;
//   /**
//    * Optional metadata to attach to the file.
//    */
//   metadata?: Record<string, string>;
// }

// /**
//  * Uploads a file to an Assistant.
//  *
//  * Note: This method does *not* use the generated code from the OpenAPI spec.
//  *
//  * @example
//  * ```typescript
//  * import { Pinecone } from '@pinecone-database/pinecone';
//  * const pc = new Pinecone();
//  * const assistantName = 'test1';
//  * const assistant = pc.Assistant(assistantName);
//  * await assistant.uploadFile({path: "test-file.txt", metadata: {"test-key": "test-value"}})
//  * // {
//  * //  name: 'test-file.txt',
//  * //  id: '921ad74c-2421-413a-8c86-fca81ceabc5c',
//  * //  metadata: { 'test-key': 'test-value' },
//  * //  createdOn: 2025-01-06T19:14:21.969Z,
//  * //  updatedOn: 2025-01-06T19:14:21.969Z,
//  * //  status: 'Processing',
//  * //  percentDone: null,
//  * //  signedUrl: null,
//  * //  errorMessage: null
//  * // }
//  * ```
//  *
//  * @param assistantName - The name of the Assistant to upload the file to.
//  * @param config - The Pinecone configuration object.
//  * @throws An error if the file path is not provided.
//  * @returns A promise that resolves to a {@link AssistantFileModel} object containing the file details.
//  */
// export const uploadFileClosed = (
//   assistantName: string,
//   config: PineconeConfiguration
// ) => {
//   return async (options: UploadFile): Promise<AssistantFileModel> => {
//     if (!options.path) {
//       throw new Error('File path is required in the options.');
//     }

//     const filePath = options.path;
//     console.log('PATH: ', filePath);
//     const form = new FormData();
//     form.append('file', fs.createReadStream(filePath));

//     const reqHeaders = {
//       headers: {
//         ...form.getHeaders(),
//         ...(config.additionalHeaders || null),
//         'Api-Key': config.apiKey,
//         'User-Agent': buildUserAgent(config),
//         'X-Pinecone-Api-Version': X_PINECONE_API_VERSION,
//       },
//     };

//     const hostUrl = await AssistantHostSingleton.getHostUrl(
//       config,
//       assistantName
//     );

//     let url = `${hostUrl}/files/${assistantName}`;

//     if (options.metadata) {
//       const encodedMetadata = encodeURIComponent(
//         JSON.stringify(options.metadata)
//       );
//       url += `?metadata=${encodedMetadata}`;
//     }
//     try {
//       const resp = await axios.post(url, form, reqHeaders);
//       return {
//         name: resp.data.name,
//         id: resp.data.id,
//         metadata: resp.data.metadata || null,
//         createdOn: new Date(resp.data.createdOn),
//         updatedOn: new Date(resp.data.updatedOn),
//         status: resp.data.status,
//         percentDone: resp.data.percentDone || null,
//         signedUrl: resp.data.signedUrl || null,
//         errorMessage: resp.data.errorMessage || null,
//       } as AssistantFileModel;
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         console.error('Axios error:', error.response?.status, error.message);
//         console.error('Axios error JSON:', error.toJSON());
//         throw new Error(
//           `Request failed with status ${error.response?.status || 'unknown'}`
//         );
//       } else {
//         console.error('Unexpected error:', error);
//         console.error('Axios error JSON:', JSON.stringify(error));
//         throw new Error(
//           'An unexpected error occurred while making the request'
//         );
//       }
//     }
//   };
// };
