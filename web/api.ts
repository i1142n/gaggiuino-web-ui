import type { Profile, ProfileSummary } from '../server/profile.ts'

export type ProfileListEntry = ProfileSummary & { description: string }

export type ProfileWithDescription = Profile & { description: string }

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `${response.status} ${response.statusText}`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}
