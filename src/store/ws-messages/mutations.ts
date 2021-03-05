import { MutationTree } from 'vuex'
import { WsMessagesStateInterface } from './state'
import { Message } from './types'

const mutation: MutationTree<WsMessagesStateInterface> = {
  push (state: WsMessagesStateInterface, message: Message) {
    state.messages.push(message)
  },

  remove (state: WsMessagesStateInterface, messageUuid: string) {
    state.messages = state.messages.filter(msg => msg.uuid !== messageUuid)
  }
}

export default mutation
