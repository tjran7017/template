import { setupServer } from 'msw/node'

import { handlers, resetOrders } from './handlers'

export const server = setupServer(...handlers)
export { resetOrders }
