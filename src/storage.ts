import { Nullable } from './types'

enum Record {
  AgentConnection = 'AGENT_CONNECTION',
  AdminApiUrl = 'ADMIN_API_URL',
  OcaRepoUrl = 'OCA_REPO_URL',
  WebsocketUrl = 'WEBSOCKET_URL',
}

const storage = window.localStorage

const set = (key: Record, value: string) => {
  storage.setItem(key, value)
}

const get = (key: Record): Nullable<string> => {
  return storage.getItem(key) as Nullable<string>
}

const remove = (key: Record) => {
  storage.removeItem(key)
}

export default { set, get, remove, Record }
