import * as gaggiuino from './gaggiuino.ts'
import { HttpError } from './gaggiuino.ts'
import type { ProfileData } from './gaggiuino.ts'
import { deleteDescription, getDescription, getSetting, setDescription, setSetting } from './settings.ts'
import type { Settings } from './settings.ts'

export interface ProfileInput extends ProfileData {
  id?: number
  description?: string
}

function machineProfile(input: ProfileInput): ProfileData {
  const { id, description, ...profile } = input
  return profile
}

export async function getStatus() {
  const status = await gaggiuino.getStatus()
  return { ...status, brewing: gaggiuino.isBrewing(status) }
}

export async function listProfiles() {
  const profiles = await gaggiuino.listProfiles()
  return profiles.map((profile) => ({ ...profile, description: getDescription(profile.id) }))
}

export async function getProfile(id: number) {
  const profile = await gaggiuino.getProfile(id)
  return { ...profile, description: getDescription(id) }
}

export async function createProfile(input: ProfileInput) {
  const created = await gaggiuino.createProfile(machineProfile(input))
  if (input.description) setDescription(created.id, input.description)
  return created
}

export async function updateProfile(id: number, input: ProfileInput) {
  const old = await gaggiuino.findProfile(id)
  const created = await gaggiuino.createProfile(machineProfile(input))
  const description = input.description ?? getDescription(id)
  if (description) setDescription(created.id, description)
  if (old.selected) {
    try {
      await gaggiuino.selectProfile(created.id)
    } catch (error) {
      await gaggiuino.deleteProfile(created.id)
      deleteDescription(created.id)
      throw error
    }
  }
  try {
    await gaggiuino.deleteProfile(id)
  } catch (error) {
    throw new HttpError(502, `Profile saved as ${created.id}, but deleting the old profile ${id} failed: ${(error as Error).message}`)
  }
  deleteDescription(id)
  return created
}

export async function deleteProfile(id: number) {
  await gaggiuino.deleteProfile(id)
  deleteDescription(id)
}

export async function selectProfile(id: number) {
  await gaggiuino.findProfile(id)
  await gaggiuino.selectProfile(id)
}

export function getSettings() {
  return {
    gaggiuinoAddress: getSetting('gaggiuinoAddress'),
    agentPermissions: getSetting('agentPermissions'),
    agentsMd: getSetting('agentsMd'),
  }
}

export function setGaggiuinoAddress(address: string) {
  setSetting('gaggiuinoAddress', address)
}

export function setAgentsMd(text: string) {
  setSetting('agentsMd', text)
}

export function setAgentPermissions(changes: Partial<Settings['agentPermissions']>) {
  setSetting('agentPermissions', { ...getSetting('agentPermissions'), ...changes })
}
