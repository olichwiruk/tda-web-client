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
  },
  credentialReceivedMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/verifiable-services/credential-received/'
    })
  },

  connectionMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/connections/'
    })
  },

  presentProofMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/present_proof/'
    })
  },
  pdsPayloadMessages ({ messages }) {
    return messages.filter(message => {
      return message.topic === '/topic/pds/payload/'
    })
  }
}

export default getters
