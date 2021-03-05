import { GetterTree } from 'vuex'
import { StateInterface } from '../index'
import { WsMessagesStateInterface } from './state'

const getters: GetterTree<WsMessagesStateInterface, StateInterface> = {
  messages ({ messages }) {
    return messages
  },

  serviceListMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/verifiable-services/request-service-list/'
    })
  },
  servicePolicyValidationMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/verifiable-services/request-service-list/usage-policy/'
    })
  },
  incomingApplicationMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/verifiable-services/incoming-pending-application/'
    })
  },
  applicationStateUpdateMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/verifiable-services/issue-state-update/'
    })
  }
}

export default getters
