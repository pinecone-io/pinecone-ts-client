import { Configuration, ConfigurationParameters, IndexOperationsApi, ResponseError, VectorOperationsApi } from './pinecone-generated-ts-fetch'
import 'cross-fetch/polyfill';

type PineconeClientConfiguration = {
  environment: string
  apiKey: string
}

class ErrorWithoutStackTrace extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorWithoutStackTrace';
    Object.setPrototypeOf(this, new.target.prototype);
    this.stack = '';
  }
}

async function streamToArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  let result = new Uint8Array(0);
  const reader = stream.getReader();
  while (true) { // eslint-disable-line no-constant-condition
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const newResult = new Uint8Array(result.length + value.length);
    newResult.set(result);
    newResult.set(value, result.length);
    result = newResult;
  }
  return result;
}

async function handler(func: Function, args: any) {
  try {
    return await func(args)
  } catch (e) {
    const error = e as ResponseError
    if (error && error.response) {
      const body = error.response?.body as ReadableStream
      const buffer = body && await streamToArrayBuffer(body);
      const text = buffer && new TextDecoder().decode(buffer);
      try {
        // Handle "RAW" call errors
        const json = text && JSON.parse(text);
        return Promise.reject(new ErrorWithoutStackTrace(`${json?.message}`))

      } catch (e) {
        return Promise.reject(new ErrorWithoutStackTrace(`PineconeClient: Error calling ${func.name.replace("bound ", "")}: ${text}`))
      }
    }
    else {
      return Promise.reject(new ErrorWithoutStackTrace(`PineconeClient: Error calling ${func.name.replace("bound ", "")}: ${error}`))
    }
  }
}

function exposeMethods(instance: any, target: PineconeClient) {
  for (const prop of Object.keys(Object.getPrototypeOf(instance))) {
    let descriptor = instance[prop];
    if (descriptor && typeof descriptor === 'function' && prop !== 'constructor') {
      // @ts-ignore
      target[prop] = async (args?) => {
        Object.defineProperty(descriptor, 'name', { value: prop })
        let boundFunction: Function = descriptor.bind(instance);

        return handler(boundFunction, args)
      }
    }
  }
}

function attachHandler(instance: VectorOperationsApi): VectorOperationsApi {
  for (const prop of Object.keys(Object.getPrototypeOf(instance))) {
    let descriptor = instance[prop];
    if (descriptor && typeof descriptor === 'function' && prop !== 'constructor') {
      // @ts-ignore
      instance[prop] = async (args?) => {
        Object.defineProperty(descriptor, 'name', { value: prop })
        let boundFunction: Function = descriptor.bind(instance);
        return handler(boundFunction, args)
      }
    }
  }
  return instance
}

interface PineconeClient extends IndexOperationsApi { }

class PineconeClient {
  apiKey: string | null = null
  projectName: string | null = null
  environment: string | null = null

  private async getProjectName(controllerPath: string, apiKey: string) {
    const whoami = `${controllerPath}/actions/whoami`
    const request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      }
    }

    try {
      // Workaround for Jest TLSWRAP issue
      await process.nextTick(() => { });
      const response = await fetch(whoami, request)
      const { project_name } = await response.json()
      return project_name
    } catch (error) {
      throw new ErrorWithoutStackTrace(`PineconeClient: Error getting project name: ${error}`)
    }
  }

  public async init(configuration: PineconeClientConfiguration) {
    const { environment, apiKey } = configuration
    this.apiKey = apiKey
    this.environment = environment

    const controllerPath = `https://controller.${environment}.pinecone.io`
    this.projectName = await this.getProjectName(controllerPath, apiKey)

    const controllerConfigurationParameters: ConfigurationParameters = {
      basePath: controllerPath,
      apiKey: apiKey
    }

    const controllerConfiguration = new Configuration(controllerConfigurationParameters)
    const indexOperations = new IndexOperationsApi(controllerConfiguration)
    exposeMethods(indexOperations, this as PineconeClient);
  }

  public Index(index: string) {
    if (!this.apiKey) throw new Error('PineconeClient: API key not set. Call init() first.')
    if (!this.projectName) throw new Error('PineconeClient: Project name not set. Call init() first.')
    if (!this.environment) throw new Error('PineconeClient: Environment not set. Call init() first.')

    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: `https://${index}-${this.projectName}.svc.${this.environment}.pinecone.io`,
      apiKey: this.apiKey
    }

    const indexConfiguration = new Configuration(indexConfigurationParameters)
    const vectorOperations = new VectorOperationsApi(indexConfiguration)
    return attachHandler(vectorOperations)

  }
}

export { PineconeClient }
export { QueryRequest, CreateRequest, UpdateRequest, DeleteRequest, UpsertRequest, Vector, QueryVector, PatchRequest, IndexMeta, CreateCollectionRequest, ScoredVector } from './pinecone-generated-ts-fetch'