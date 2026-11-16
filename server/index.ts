import path from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { getSetting } from './settings.ts'

const app = Fastify({ logger: true })

await app.register(fastifyStatic, { root: path.join(import.meta.dirname, '..', 'dist', 'web') })

app.setNotFoundHandler((request, reply) => {
  const isPage = request.method === 'GET' && !request.url.startsWith('/api') && !request.url.startsWith('/assets')
  return isPage ? reply.sendFile('index.html') : reply.code(404).send({ error: 'Not found' })
})

app.log.info(`Gaggiuino address: ${getSetting('gaggiuinoAddress')}`)

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 80) })
