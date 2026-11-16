import { reactive } from 'vue'

export const live = reactive({
  reachable: undefined as boolean | undefined,
  error: '',
  profileId: undefined as number | undefined,
  profileName: '',
})

const source = new EventSource('/api/live')

source.addEventListener('status', (event) => {
  const data = JSON.parse((event as MessageEvent).data)
  live.reachable = data.reachable
  live.error = data.reachable ? '' : data.error
  if (data.reachable) {
    live.profileId = data.status.profileId
    live.profileName = data.status.profileName
  }
})
