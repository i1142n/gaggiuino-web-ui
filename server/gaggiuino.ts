import { getSetting } from './settings.ts'
import type { Profile, ProfileData, ProfileSummary } from './profile.ts'

export type { Curve, Phase, Profile, ProfileData, ProfileSummary, StopConditions } from './profile.ts'

export interface Status {
  upTime: number
  profileId: number
  profileName: string
  operationMode: string
  brewActive: boolean
  brewSwitchState: boolean
  steamActive: boolean
  hotWaterActive: boolean
  temperature: number
  targetTemperature: number
  pressure: number
  pumpFlow: number
  weightFlow: number
  weight: number
  waterLevel: number
}

export interface Shot {
  id: number
  timestamp: number
  duration: number
  datapoints: {
    timeInShot: number[]
    pressure: number[]
    pumpFlow: number[]
    weightFlow: number[]
    temperature: number[]
    shotWeight: number[]
    waterPumped: number[]
    targetTemperature: number[]
    targetPumpFlow: number[]
    targetPressure: number[]
    phaseIndex: number[]
  }
  profile: Profile
}

export interface Versions {
  coreVersion: string
  frontVersion: string
  staticVersion: string
}

export class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

const isTrue = (value: unknown) => value === true || value === 'true'
const tenths = (values: number[]) => values.map((value) => value / 10)

async function request(path: string, init: RequestInit = {}) {
  const address = getSetting('gaggiuinoAddress')
  let response: Response
  try {
    response = await fetch(`http://${address}${path}`, { ...init, signal: AbortSignal.timeout(3000) })
  } catch {
    throw new HttpError(503, `Gaggiuino not reachable at ${address}`)
  }
  if (!response.ok) {
    const statusCode = response.status === 404 || response.status === 422 ? response.status : 502
    throw new HttpError(statusCode, `Gaggiuino answered ${response.status} for ${path}: ${await response.text()}`)
  }
  return response
}

async function getJson(path: string): Promise<any> {
  return (await request(path)).json()
}

export function isBrewing(status: Status) {
  return status.brewActive && (status.operationMode === 'BREW_AUTO' || status.operationMode === 'BREW_MANUAL')
}

export async function getVersions(): Promise<Versions> {
  return getJson('/api/settings/versions')
}

export async function getStatus(): Promise<Status> {
  const [raw] = await getJson('/api/system/status')
  return {
    upTime: Number(raw.upTime),
    profileId: Number(raw.profileId),
    profileName: String(raw.profileName),
    operationMode: String(raw.operationMode),
    brewActive: isTrue(raw.brewActive),
    brewSwitchState: isTrue(raw.brewSwitchState),
    steamActive: isTrue(raw.steamActive),
    hotWaterActive: isTrue(raw.hotWaterActive),
    temperature: Number(raw.temperature),
    targetTemperature: Number(raw.targetTemperature),
    pressure: Number(raw.pressure),
    pumpFlow: Number(raw.pumpFlow),
    weightFlow: Number(raw.weightFlow),
    weight: Number(raw.weight),
    waterLevel: Number(raw.waterLevel),
  }
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  const raw: { id: unknown; name: unknown; selected: unknown }[] = await getJson('/api/profiles/all')
  return raw.map((profile) => ({ id: Number(profile.id), name: String(profile.name), selected: isTrue(profile.selected) }))
}

export async function getProfile(id: number): Promise<Profile> {
  return { ...(await getJson(`/api/profile/${id}`)), id }
}

export async function createProfile(profile: ProfileData): Promise<{ id: number; name: string }> {
  const response = await request('/api/profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(profile),
  })
  const created = await response.json()
  return { id: Number(created.id), name: String(created.name) }
}

export async function selectProfile(id: number) {
  await request(`/api/profile-select/${id}`, { method: 'POST' })
}

export async function findProfile(id: number) {
  const profile = (await listProfiles()).find((summary) => summary.id === id)
  if (!profile) throw new HttpError(404, `Profile ${id} not found on the Gaggiuino`)
  return profile
}

export async function deleteProfile(id: number) {
  const profile = await findProfile(id)
  if (profile.selected) throw new HttpError(409, `Profile ${id} is active; select another profile before deleting it`)
  await request(`/api/profile-select/${id}`, { method: 'DELETE' })
}

export async function getLatestShotId(): Promise<number> {
  const [latest] = await getJson('/api/shots/latest')
  return Number(latest.lastShotId)
}

export async function getShot(id: number): Promise<Shot> {
  const raw = await getJson(`/api/shots/${id}`)
  const points = raw.datapoints
  return {
    id: raw.id,
    timestamp: raw.timestamp,
    duration: raw.duration / 10,
    datapoints: {
      timeInShot: tenths(points.timeInShot),
      pressure: tenths(points.pressure),
      pumpFlow: tenths(points.pumpFlow),
      weightFlow: tenths(points.weightFlow),
      temperature: tenths(points.temperature),
      shotWeight: tenths(points.shotWeight),
      waterPumped: tenths(points.waterPumped),
      targetTemperature: tenths(points.targetTemperature),
      targetPumpFlow: tenths(points.targetPumpFlow),
      targetPressure: tenths(points.targetPressure),
      phaseIndex: points.phaseIndex,
    },
    profile: raw.profile,
  }
}
