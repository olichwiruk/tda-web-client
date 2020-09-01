const uuidv4 = require('uuid/v4');

const state = {
  messages: []
}

const mutations = {
  ADD_MESSAGE (state, message) {
    state.messages.push(Object.assign(message, { uuid: uuidv4().toString() }));
  },
  DELETE_MESSAGE (state, uuid: string) {
    state.messages = state.messages.filter(function(element, index, arr){
      return element.uuid != uuid;
    });
  }
};

const actions = {
  add_message (context, message) {
    context.commit('ADD_MESSAGE', message);
  },
  delete_message (context, uuid: string) {
    context.commit('DELETE_MESSAGE', uuid);
  },
  get_message (context, uuid: string) {
    let message = context.state.messages.find(function(element){
      return element.uuid == uuid;
    });
    return message;
  },
  get_messages_by_topic (context, topic: string) {
    let messages = context.state.messages.filter(function(element){
      return element.topic == topic;
    });
    return messages;
  }
};

export default {
  namespaced: true,   // ADD THIS LINE
  state,
  mutations,
  actions,
};
