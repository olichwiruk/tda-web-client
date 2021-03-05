import { Module } from 'vuex'
import { StateInterface } from '../index'
import state, { WsMessagesStateInterface } from './state'
import actions from './actions'
import getters from './getters'
import mutations from './mutations'

const wsMessagesModule: Module<WsMessagesStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
}

export default wsMessagesModule
