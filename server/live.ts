import { randomUUID } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import { getLatestShotId } from './gaggiuino.ts'
import { getStatus } from './service.ts'

const clients = new Set<ServerResponse>()
let lastStatusMessage = ''
let brew: { id: string; lastShotId?: number } | undefined

function send(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) client.write(message)
  return message
}

async function latestShotIdIfReachable() {
  try {
    return await getLatestShotId()
  } catch {
    return undefined
  }
}

async function poll() {
  const startedAt = Date.now()
  try {
    const status = await getStatus()
    if (status.brewing && !brew) {
      brew = { id: randomUUID(), lastShotId: await latestShotIdIfReachable() }
      send('brew-start', { brewId: brew.id, profileId: status.profileId, profileName: status.profileName })
    }
    lastStatusMessage = send('status', { time: startedAt, reachable: true, brewId: status.brewing ? brew?.id : undefined, status })
    if (!status.brewing && brew) {
      const lastShotId = await latestShotIdIfReachable()
      send('brew-end', { brewId: brew.id, lastShotId: lastShotId !== brew.lastShotId ? lastShotId : undefined })
      brew = undefined
    }
  } catch (error) {
    lastStatusMessage = send('status', { time: startedAt, reachable: false, error: (error as Error).message })
  }
  setTimeout(poll, Math.max(0, (brew ? 500 : 1000) - (Date.now() - startedAt)))
}

export function startLive() {
  poll()
}

export function addLiveClient(response: ServerResponse) {
  response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
  response.write(lastStatusMessage)
  clients.add(response)
  response.on('close', () => clients.delete(response))
}
