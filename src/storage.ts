import { Nullable } from './types'

enum Record {
  AgentConnection = 'AGENT_CONNECTION',
}

const storage = window.localStorage

const set = (key: Record, value: string) => {
  storage.setItem(key, value)
}

const get = (key: Record): Nullable<string> => {
  return storage.getItem(key) as Nullable<string>
}

export default { set, get, Record }
