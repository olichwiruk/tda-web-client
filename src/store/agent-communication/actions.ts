import { ActionTree } from 'vuex'
import { StateInterface } from '../index'
import { AgentCommunicationStateInterface } from './state'
import { Message } from './types'

const prefix = 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec'

const actions: ActionTree<AgentCommunicationStateInterface, StateInterface> = {
  resolve ({ commit }, message: Message) {
    switch (message['@type']) {
      case `${prefix}/admin-connections/0.1/invitation`:
        commit('updateInvitationUrl', message.invitation_url)
        break
      case `${prefix}/admin-connections/0.1/connection-list`:
        commit('updateConnections', message.results)
        break
      default:
        commit('push', message)
        break
    }
  },
  removeMessage ({ commit }, messageId: string) {
    commit('remove', messageId)
  }
}

export default actions
