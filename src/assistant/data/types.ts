/**
 * The `ListFilesOptions` interface describes the options (a single filter) that can be passed to the `listFiles` method.
 */
export interface ListFilesOptions {
  /**
   * A filter object to filter the files returned by the `listFiles` method.
   */
  filter?: object;
}

/**
 * The `ChatOptions` interface describes the request format for sending a message to an Assistant.
 */
export interface ChatOptions {
  /**
   * The messages to send to the Assistant. Can be a list of strings or a list of objects. If sent as a list of
   * objects, must have exactly two keys: `role` and `content`. The `role` key can only be one of `user` or `assistant`.
   */
  messages: string[] | Array<{ [key: string]: string }>;
  /**
   * If false, the Assistant will return a single JSON response. If true, the Assistant will return a stream of responses.
   */
  stream?: boolean;
  /**
   * The large language model to use for answer generation. Must be one outlined in {@link ChatModelEnum}.
   */
  model?: string;
  /**
   * A filter against which documents can be retrieved.
   */
  filter?: object;
}

/**
 * The `ContextOptions` interface describes the query and optional filter to retrieve context snippets from an Assistant.
 */
export interface ContextOptions {
  /**
   * The query to retrieve context snippets for.
   */
  query: string;
  /**
   * Optional filter to apply to the context snippets.
   */
  filter?: Record<string, string>;
}

/**
 * The `UploadFileOptions` interface describes the file path for uploading a file to an Assistant and optional metadata.
 */
export interface UploadFileOptions {
  /**
   * The (local) path to the file to upload.
   */
  path: string;
  /**
   * Optional metadata to attach to the file.
   */
  metadata?: Record<string, string>;
}
