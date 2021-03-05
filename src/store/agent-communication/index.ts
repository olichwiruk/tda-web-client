import { Module } from 'vuex'
import { StateInterface } from '../index'
import state, { AgentCommunicationStateInterface } from './state'
import actions from './actions'
import getters from './getters'
import mutations from './mutations'

const agentCommunicationModule: Module<AgentCommunicationStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
}

export default agentCommunicationModule
