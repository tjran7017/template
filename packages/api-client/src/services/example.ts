import { createServiceClient, type ServiceConfig } from '../core'

interface Order {
  id: string
  item: string
  quantity: number
  createdAt: string
}

export interface ExamplePaths {
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
  '/stats': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': { uptime: number; requestsPerMin: number }
          }
        }
      }
    }
  }
  '/orders': {
    get: {
      responses: {
        200: { content: { 'application/json': Order[] } }
      }
    }
    post: {
      requestBody: {
        content: { 'application/json': { item: string; quantity: number } }
      }
      responses: {
        200: { content: { 'application/json': Order } }
      }
    }
  }
}

export function createExampleClient(config: ServiceConfig) {
  return createServiceClient<ExamplePaths>(config)
}
