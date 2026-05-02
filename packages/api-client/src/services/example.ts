import { createServiceClient, type ServiceConfig } from '../core.js'

export type ExamplePaths = {
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': { status: string }
          }
        }
      }
    }
  }
}

export function createExampleClient(config: ServiceConfig) {
  return createServiceClient<ExamplePaths>(config)
}
