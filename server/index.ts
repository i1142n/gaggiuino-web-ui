import path from 'node:path'
import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import fastifyStatic from '@fastify/static'
import { getSetting } from './settings.ts'
import { HttpError } from './gaggiuino.ts'
import { apiRoutes } from './routes/api.ts'
import { startLive } from './live.ts'

const app = Fastify({ logger: true, ajv: { customOptions: { removeAdditional: false } } })

await app.register(fastifyStatic, { root: path.join(import.meta.dirname, '..', 'dist', 'web') })

app.setErrorHandler((error: FastifyError, request, reply) => {
  const statusCode = error.statusCode ?? 500
  if (statusCode >= 500 && error instanceof HttpError) request.log.warn(error.message)
  else if (statusCode >= 500) request.log.error(error)
  reply.code(statusCode).send({ error: error.message })
})

app.setNotFoundHandler((request, reply) => {
  const isPage = request.method === 'GET' && !request.url.startsWith('/api') && !request.url.startsWith('/assets')
  return isPage ? reply.sendFile('index.html') : reply.code(404).send({ error: 'Not found' })
})

apiRoutes(app)

app.log.info(`Gaggiuino address: ${getSetting('gaggiuinoAddress')}`)

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 80) })

startLive()
