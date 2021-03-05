import { ActionTree } from 'vuex'
import { StateInterface } from '../index'
import { WsMessagesStateInterface } from './state'
import { Message } from './types'
import { v4 as uuid } from 'uuid'

const actions: ActionTree<WsMessagesStateInterface, StateInterface> = {
  addMessage ({ commit }, message: Message) {
    commit('push', { ...message, uuid: uuid() })
  },
  deleteMessage ({ commit }, messageUuid: string) {
    commit('remove', messageUuid)
  }
}

export default actions
