import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

export const defaults = {
  gaggiuinoAddress: '192.168.8.103',
  agentPermissions: {
    readStatus: true,
    readProfiles: true,
    selectProfile: true,
    createProfile: true,
    updateProfile: true,
    deleteProfile: false,
    startBrew: true,
    readLive: true,
    readSettings: true,
    changeSettings: false,
    changeWifi: false,
    editAgentsMd: false,
  },
  agentsMd: '',
}

export type Settings = typeof defaults

const dataDir = path.join(import.meta.dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'app.sqlite'))
db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')

const insertDefault = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
for (const [key, value] of Object.entries(defaults)) {
  insertDefault.run(key, JSON.stringify(value))
}

const selectValue = db.prepare('SELECT value FROM settings WHERE key = ?')
const upsertValue = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value')
const deleteValue = db.prepare('DELETE FROM settings WHERE key = ?')

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  const row = selectValue.get(key) as { value: string }
  const value = JSON.parse(row.value)
  return key === 'agentPermissions' ? { ...defaults.agentPermissions, ...value } : value
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  upsertValue.run(key, JSON.stringify(value))
}

export function getDescription(profileId: number): string {
  const row = selectValue.get(`description:${profileId}`) as { value: string } | undefined
  return row ? JSON.parse(row.value) : ''
}

export function setDescription(profileId: number, text: string) {
  upsertValue.run(`description:${profileId}`, JSON.stringify(text))
}

export function deleteDescription(profileId: number) {
  deleteValue.run(`description:${profileId}`)
}
