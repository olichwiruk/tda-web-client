import { MutationTree } from 'vuex'
import { AgentCommunicationStateInterface } from './state'
import { Message, Connection, Did } from './types'

const mutation: MutationTree<AgentCommunicationStateInterface> = {
  push (state: AgentCommunicationStateInterface, message: Message) {
    state.messages.push(message)
  },

  remove (state: AgentCommunicationStateInterface, messageId: string) {
    state.messages = state.messages.filter(msg => msg['@id'] !== messageId)
  },

  updateInvitationUrl (state: AgentCommunicationStateInterface, invitationUrl: string) {
    state.invitationUrl = invitationUrl
  },

  updateConnections (state: AgentCommunicationStateInterface, connections: Connection[]) {
    state.connections = connections
  },

  updateDids (state: AgentCommunicationStateInterface, dids: Did[]) {
    state.dids = dids
  }
}

export default mutation
