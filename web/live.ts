import { reactive } from 'vue'

export const live = reactive({ reachable: false, profileName: '' })

const source = new EventSource('/api/live')

source.addEventListener('status', (event) => {
  const data = JSON.parse((event as MessageEvent).data)
  live.reachable = data.reachable
  if (data.reachable) live.profileName = data.status.profileName
})
