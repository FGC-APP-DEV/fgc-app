import express from 'express'
import cors from 'cors'
import http from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { typeDefs } from '@fgc/graphql'
import { resolvers } from './resolvers'
import { createContext } from './context'
import type { Context } from './context'
import {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
} from '@fgc/database'

const PORT = parseInt(process.env.PORT || '4000', 10)
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.CORS_ORIGINS?.split(',')
    .map(o => o.trim())
    .filter(Boolean) ?? []),
]

async function startServer() {
  console.log('Connecting to database...')
  await connectDatabase()
  const healthy = await checkDatabaseHealth()
  if (!healthy) {
    throw new Error('Database health check failed')
  }
  console.log('Database OK')

  const app = express()
  app.disable('x-powered-by')
  const httpServer = http.createServer(app)

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await disconnectDatabase()
            },
          }
        },
      },
    ],
  })

  await server.start()

  app.use(
    '/',
    cors({
      origin: (origin, cb) => {
        if (origin === undefined || allowedOrigins.includes(origin)) {
          cb(null, true)
          return
        }
        cb(null, false)
      },
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req),
    }),
  )

  await new Promise<void>(resolve => httpServer.listen({ port: PORT }, resolve))
  console.log(`FGC API ready at http://localhost:${PORT}/graphql`)
}

startServer().catch(err => {
  console.error(err)
  process.exit(1)
})
