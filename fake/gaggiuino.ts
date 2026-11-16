import fs from 'node:fs'
import path from 'node:path'
import Fastify from 'fastify'
import type { Phase, Profile, StopConditions } from '../server/gaggiuino.ts'
import { phaseTarget, puckModel } from '../web/curve.ts'

interface Reading {
  time: number
  pressure: number
  pumpFlow: number
  waterPumped: number
}

const tickMs = 150
const minShotDeciseconds = 50

const fixtureDir = path.join(import.meta.dirname, '..', 'fixtures')
const readFixture = (name: string) => JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8'))

const versions = readFixture('settings-versions.json')
const status = readFixture('system-status.json')[0]
const summaries: { id: number; selected: string }[] = readFixture('profiles-all.json')
let profiles: Profile[] = summaries.map((summary) => ({ ...readFixture(`profile-${summary.id}.json`), id: summary.id }))
let activeId = summaries.find((summary) => summary.selected === 'true')!.id
let lastShotId: number = readFixture('shots-latest.json')[0].lastShotId
const shots = new Map<number, unknown>()
for (const file of fs.readdirSync(fixtureDir).filter((name) => /^shot-\d+\.json$/.test(name))) {
  const shot = readFixture(file)
  shots.set(shot.id, shot)
}

const live = { brewing: false, pressure: 0, pumpFlow: 0, weightFlow: 0, weight: 0, temperature: 0 }
const startedAt = Date.now()

const findProfile = (id: string) => profiles.find((profile) => profile.id === Number(id))
const activeProfile = () => profiles.find((profile) => profile.id === activeId)!
const jitter = (value: number, spread: number) => value + (Math.random() - 0.5) * spread
const deci = (value: number) => Math.round(value * 10)
const above = (limit: number | undefined, value: number) => (limit ?? 0) > 0 && value > limit!
const below = (limit: number | undefined, value: number) => (limit ?? 0) > 0 && value < limit!

function currentStatus() {
  const profile = activeProfile()
  const targetTemperature = profile.waterTemperature ?? 0
  const temperature = live.brewing ? live.temperature : jitter(targetTemperature - 0.2, 0.4)
  return {
    ...status,
    upTime: String(Number(status.upTime) + Math.floor((Date.now() - startedAt) / 1000)),
    profileId: String(profile.id),
    profileName: profile.name,
    targetTemperature: targetTemperature.toFixed(6),
    temperature: temperature.toFixed(6),
    pressure: live.pressure.toFixed(6),
    weight: live.weight.toFixed(6),
    pumpFlow: Number(live.pumpFlow.toFixed(2)),
    weightFlow: Number(live.weightFlow.toFixed(2)),
    brewActive: live.brewing,
    brewSwitchState: live.brewing,
    operationMode: live.brewing ? 'BREW_AUTO' : status.operationMode,
  }
}

function phaseStopReached(stop: StopConditions, timeInPhase: number, reading: Reading, shotWeight: number, phaseStart: Reading) {
  return (
    ((stop.time ?? 0) > 0 && timeInPhase >= stop.time!) ||
    above(stop.weight, shotWeight) ||
    above(stop.pressureAbove, reading.pressure) ||
    below(stop.pressureBelow, reading.pressure) ||
    above(stop.flowAbove, reading.pumpFlow) ||
    below(stop.flowBelow, reading.pumpFlow) ||
    ((stop.waterPumpedInPhase ?? 0) > 0 && reading.waterPumped - phaseStart.waterPumped >= stop.waterPumpedInPhase!)
  )
}

function startBrew(seconds: number) {
  const profile = activeProfile()
  const phases = profile.phases.filter((phase) => !phase.skip)
  const global = profile.globalStopConditions ?? {}
  const datapoints = {
    timeInShot: [] as number[],
    pressure: [] as number[],
    pumpFlow: [] as number[],
    weightFlow: [] as number[],
    temperature: [] as number[],
    shotWeight: [] as number[],
    waterPumped: [] as number[],
    targetTemperature: [] as number[],
    targetPumpFlow: [] as number[],
    targetPressure: [] as number[],
    phaseIndex: [] as number[],
  }
  const shotStart = Date.now()
  let phaseIndex = 0
  let phaseStart: Reading = { time: 0, pressure: 0, pumpFlow: 0, waterPumped: 0 }
  let waterPumped = 0
  let shotWeight = 0

  Object.assign(live, { brewing: true, pressure: 0, pumpFlow: 0, weightFlow: 0, weight: 0 })

  const timer = setInterval(() => {
    const time = Date.now() - shotStart
    const phase = phases[phaseIndex]
    const timeInPhase = time - phaseStart.time
    const isPressure = phase.type === 'PRESSURE'
    const target = phaseTarget(phase, timeInPhase, isPressure ? phaseStart.pressure : phaseStart.pumpFlow)
    const restriction = phase.restriction ?? 0
    const targets = isPressure ? { pressure: target, flow: restriction || null } : { pressure: restriction || null, flow: target }
    const model = puckModel(phase, targets, time)
    const pressure = jitter(model.pressure, 0.1)
    const pumpFlow = jitter(model.flow, isPressure ? 0.1 : 0.05)
    const targetTemperature = phase.waterTemperature ?? profile.waterTemperature ?? 0
    const temperature = jitter(targetTemperature - 0.4, 0.6)

    waterPumped += Math.max(0, pumpFlow) * (tickMs / 1000)
    const weight = Math.max(0, waterPumped - 18)
    const weightFlow = (weight - shotWeight) / (tickMs / 1000)
    shotWeight = weight
    Object.assign(live, { pressure, pumpFlow, weightFlow, weight, temperature })

    datapoints.timeInShot.push(Math.round(time / 100))
    datapoints.pressure.push(deci(pressure))
    datapoints.pumpFlow.push(deci(pumpFlow))
    datapoints.weightFlow.push(deci(weightFlow))
    datapoints.temperature.push(deci(temperature))
    datapoints.shotWeight.push(deci(shotWeight))
    datapoints.waterPumped.push(deci(waterPumped))
    datapoints.targetTemperature.push(deci(targetTemperature))
    datapoints.targetPumpFlow.push(deci(isPressure ? restriction : target))
    datapoints.targetPressure.push(deci(isPressure ? target : restriction))
    datapoints.phaseIndex.push(profile.phases.indexOf(phase))

    const reading = { time, pressure, pumpFlow, waterPumped }
    if (phaseStopReached(phase.stopConditions ?? {}, timeInPhase, reading, shotWeight, phaseStart)) {
      phaseIndex += 1
      phaseStart = reading
    }

    const finished =
      phaseIndex >= phases.length ||
      time >= seconds * 1000 ||
      (time >= 1000 && (above(global.time, time) || above(global.weight, shotWeight) || above(global.waterPumped, waterPumped)))
    if (!finished) return

    clearInterval(timer)
    Object.assign(live, { brewing: false, pressure: 0, pumpFlow: 0, weightFlow: 0 })
    const duration = Math.round(time / 100)
    if (duration >= minShotDeciseconds) {
      lastShotId += 1
      shots.set(lastShotId, { id: lastShotId, timestamp: Math.floor(shotStart / 1000), duration, datapoints, profile })
    }
  }, tickMs)
}

const app = Fastify({ logger: true })

const failingPaths = new Set<string>()

app.addHook('onRequest', async (request, reply) => {
  if (failingPaths.delete(request.url)) return reply.code(500).type('text/plain').send('Forced failure')
})

app.post<{ Querystring: { path: string } }>('/fake/fail', async (request) => {
  failingPaths.add(request.query.path)
  return { failNext: request.query.path }
})

app.get('/api/health', async () => ({ status: 'ok' }))

app.get('/api/settings/versions', async () => versions)

app.get('/api/system/status', async () => [currentStatus()])

app.get('/api/profiles/all', async () =>
  profiles.map((profile) => ({ id: profile.id, name: profile.name, selected: String(profile.id === activeId) })),
)

app.get<{ Params: { id: string } }>('/api/profile/:id', async (request, reply) => {
  const profile = findProfile(request.params.id)
  if (!profile) return reply.code(404).type('text/plain').send('Profile not found')
  const { id, ...withoutId } = profile
  return reply.header('Content-Disposition', `attachment; filename="${profile.name}.json"`).send(withoutId)
})

app.post<{ Body: Partial<Profile> | undefined }>('/api/profile', async (request, reply) => {
  const body = request.body
  if (!body || typeof body.name !== 'string' || body.name === '' || !Array.isArray(body.phases) || body.phases.length === 0) {
    return reply.code(422).type('text/plain').send('Invalid profile')
  }
  const id = Math.max(0, ...profiles.map((profile) => profile.id)) + 1
  profiles.push({ ...body, id, name: body.name, phases: body.phases })
  return { id, name: body.name }
})

app.post<{ Params: { id: string } }>('/api/profile-select/:id', async (request, reply) => {
  const profile = findProfile(request.params.id)
  if (!profile) return reply.code(500).type('text/plain').send('Profile not found')
  activeId = profile.id
  return reply.type('text/plain').send('OK')
})

app.delete<{ Params: { id: string } }>('/api/profile-select/:id', async (request, reply) => {
  const profile = findProfile(request.params.id)
  if (profile?.id === activeId) return reply.code(500).type('text/plain').send('Cannot delete the active profile')
  const deleted = profile ?? profiles.findLast((candidate) => candidate.id !== activeId)
  if (!profile) request.log.warn(`unknown profile id ${request.params.id}, deleting ${deleted?.id} like the real firmware`)
  profiles = profiles.filter((candidate) => candidate !== deleted)
  return reply.type('text/plain').send('OK')
})

app.get('/api/shots/latest', async () => [{ lastShotId }])

app.get<{ Params: { id: string } }>('/api/shots/:id', async (request, reply) => {
  const shot = shots.get(Number(request.params.id))
  if (!shot) return reply.code(404).type('text/plain').send('Shot not found')
  return shot
})

app.post<{ Querystring: { seconds?: string } }>('/fake/brew', async (request, reply) => {
  if (live.brewing) return reply.code(409).send({ error: 'already brewing' })
  if (activeProfile().phases.every((phase) => phase.skip)) return reply.code(409).send({ error: 'active profile has no phase to brew' })
  const seconds = Number(request.query.seconds) || 60
  startBrew(seconds)
  return reply.code(202).send({ brewing: true, seconds })
})

await app.listen({ host: '127.0.0.1', port: Number(process.env.FAKE_PORT ?? 8080) })
