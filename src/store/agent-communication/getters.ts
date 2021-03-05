import { GetterTree } from 'vuex'
import { StateInterface } from '../index'
import { AgentCommunicationStateInterface } from './state'

const getters: GetterTree<AgentCommunicationStateInterface, StateInterface> = {
  activeConnections ({ connections }) {
    return connections.filter(conn => (
      conn.state === 'active' && conn.their_role !== 'admin'
    ))
  },
  dids ({ dids }) {
    return dids
  }
}

export default getters
