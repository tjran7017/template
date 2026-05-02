export { ApiError, isApiError } from './errors.js'
export type { ServiceConfig, Middleware, ServiceClient } from './core.js'
export type {
  Schema,
  PathOf,
  Method,
  RequestBody,
  RequestQuery,
  RequestParams,
  ResponseBody,
} from './types.js'
export { createExampleClient } from './services/example.js'
export type { ExamplePaths } from './services/example.js'
