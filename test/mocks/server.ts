import { setupServer } from 'msw/node'

// Create MSW server — add handlers here as external API integrations are added
export const server = setupServer()
