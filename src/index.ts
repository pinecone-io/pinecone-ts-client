import axios from 'axios'
import { Configuration, ConfigurationParameters, IndexOperationsApi, VectorOperationsApi } from './pinecone-generated-ts'

type PineconeClientConfiguration = {
  environment: string
  apiKey: string
}



async function handler(func: Function, args: any) {
  try {
    return await func(args)
  } catch (error) {
    // @ts-ignore
    const message = error?.response?.data?.message || null
    throw `PineconeClient: Error calling ${func.name.replace("bound ", "")}: ${error} ${message ? `(${message})` : ''}`
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
      url: whoami,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      }
    }

    try {
      const response = await axios(request)
      const { project_name } = response.data
      return project_name
    } catch (error) {
      console.log(`PineconeClient: Error getting project name: ${error}`)
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
    const target: PineconeClient = this

    return attachHandler(vectorOperations)

  }
}

export { PineconeClient }
export { QueryRequest, CreateRequest, UpdateRequest, DeleteRequest, UpsertRequest, Vector, QueryVector, PatchRequest, IndexMeta, CreateCollectionRequest, ScoredVector } from './pinecone-generated-ts'