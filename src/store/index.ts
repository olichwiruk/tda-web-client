import { store } from 'quasar/wrappers'
import { createStore } from 'vuex'

import agentCommunication from './agent-communication'
import { AgentCommunicationStateInterface } from './agent-communication/state'
import wsMessages from './ws-messages'
import { WsMessagesStateInterface } from './ws-messages/state'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export interface StateInterface {
  agentCommunication: AgentCommunicationStateInterface;
  wsMessages: WsMessagesStateInterface;
}

export default store(function () {
  const Store = createStore({
    modules: {
      agentCommunication,
      wsMessages
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: !!process.env.DEBUGGING
  })

  return Store
})
