import { Message } from './types'

export interface WsMessagesStateInterface {
  messages: Message[];
}

function state (): WsMessagesStateInterface {
  return {
    messages: []
  }
}

export default state
