import type { FastifyInstance } from 'fastify'
import * as service from '../service.ts'
import type { ProfileInput } from '../service.ts'
import { defaults } from '../settings.ts'
import type { Settings } from '../settings.ts'
import { addLiveClient } from '../live.ts'

interface SettingsChanges {
  gaggiuinoAddress?: string
  agentPermissions?: Partial<Settings['agentPermissions']>
  agentsMd?: string
}

const idParams = {
  type: 'object',
  properties: { id: { type: 'integer' } },
}

const profileBody = {
  type: 'object',
  required: ['name', 'phases'],
  properties: {
    name: { type: 'string', minLength: 1 },
    phases: { type: 'array', minItems: 1, items: { type: 'object' } },
    description: { type: 'string' },
  },
}

const settingsBody = {
  type: 'object',
  additionalProperties: false,
  properties: {
    gaggiuinoAddress: { type: 'string', pattern: '^[A-Za-z0-9.-]+(:[0-9]+)?$' },
    agentPermissions: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(Object.keys(defaults.agentPermissions).map((key) => [key, { type: 'boolean' }])),
    },
    agentsMd: { type: 'string' },
  },
}

type WithId = { Params: { id: number } }

export function apiRoutes(app: FastifyInstance) {
  app.get('/api/status', () => service.getStatus())

  app.get('/api/profiles', () => service.listProfiles())

  app.get<WithId>('/api/profiles/:id', { schema: { params: idParams } }, (request) => service.getProfile(request.params.id))

  app.post<{ Body: ProfileInput }>('/api/profiles', { schema: { body: profileBody } }, async (request, reply) => {
    reply.code(201)
    return service.createProfile(request.body)
  })

  app.put<WithId & { Body: ProfileInput }>('/api/profiles/:id', { schema: { params: idParams, body: profileBody } }, (request) =>
    service.updateProfile(request.params.id, request.body),
  )

  app.delete<WithId>('/api/profiles/:id', { schema: { params: idParams } }, async (request, reply) => {
    await service.deleteProfile(request.params.id)
    reply.code(204)
  })

  app.post<WithId>('/api/profiles/:id/select', { schema: { params: idParams } }, async (request, reply) => {
    await service.selectProfile(request.params.id)
    reply.code(204)
  })

  app.get('/api/settings', () => service.getSettings())

  app.put<{ Body: SettingsChanges }>('/api/settings', { schema: { body: settingsBody } }, (request) => {
    const { gaggiuinoAddress, agentPermissions, agentsMd } = request.body
    if (gaggiuinoAddress !== undefined) service.setGaggiuinoAddress(gaggiuinoAddress)
    if (agentPermissions !== undefined) service.setAgentPermissions(agentPermissions)
    if (agentsMd !== undefined) service.setAgentsMd(agentsMd)
    return service.getSettings()
  })

  app.get('/api/live', (request, reply) => {
    reply.hijack()
    addLiveClient(reply.raw)
  })
}
