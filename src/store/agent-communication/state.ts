import { Message, Connection, Did } from './types'

export interface AgentCommunicationStateInterface {
  messages: Message[];
  connections: Connection[];
  invitationUrl: string;
  dids: Did[];
}

function state (): AgentCommunicationStateInterface {
  return {
    messages: [],
    connections: [],
    invitationUrl: '',
    dids: []
  }
}

export default state
