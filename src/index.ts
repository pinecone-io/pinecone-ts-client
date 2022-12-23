import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Configuration, ConfigurationParameters, IndexOperationsApi, VectorOperationsApi } from './pinecone-generated-ts'

type PineconeClientConfiguration = {
  enviornment: string
  index: string
  apiKey: string
}

async function handler(func: Function, args: any) {
  try {
    return await func(args)
  } catch (error) {
    throw `PineconeClient: Error calling ${func.name}: ${error}`
  }
}

function exposeMethods(instance: any, target: PineconeClient) {
  for (const prop of Object.keys(Object.getPrototypeOf(instance))) {
    const descriptor = instance[prop];
    if (descriptor && typeof descriptor === 'function' && prop !== 'constructor') {
      // @ts-ignore
      target[prop] = async (args?) => {
        const boundFunction: Function = descriptor.bind(instance);
        return handler(boundFunction, args)
      }
    }
  }
}

interface PineconeClient extends IndexOperationsApi, VectorOperationsApi { }

class PineconeClient {
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
    const { enviornment, index, apiKey } = configuration
    const controllerPath = `https://controller.${enviornment}.pinecone.io`
    const projectName = await this.getProjectName(controllerPath, apiKey)

    const controllerConfigurationParameters: ConfigurationParameters = {
      basePath: controllerPath,
      apiKey: apiKey
    }

    const indexConfigurationParameters: ConfigurationParameters = {
      basePath: `https://${index}-${projectName}.svc.${enviornment}.pinecone.io`,
      apiKey: apiKey
    }

    const controllerConfiguration = new Configuration(controllerConfigurationParameters)
    const indexConfiguration = new Configuration(indexConfigurationParameters)

    const vectorOperations = new VectorOperationsApi(indexConfiguration)
    const indexOperations = new IndexOperationsApi(controllerConfiguration)

    exposeMethods(indexOperations, this as PineconeClient);
    exposeMethods(vectorOperations, this as PineconeClient);
  }
}

export { PineconeClient }