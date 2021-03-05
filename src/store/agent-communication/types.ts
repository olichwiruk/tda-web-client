import { Dictionary } from '../../types'

export type Message = Dictionary & {
  '@id': string,
  '@type': string
}

export type Connection = &Dictionary

export type Did = &Dictionary
