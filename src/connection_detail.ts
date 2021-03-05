import * as DIDComm from 'pack-unpack'
import sodium from 'libsodium-wrappers'
import * as bs58 from 'bs58'
import { v4 as uuid } from 'uuid'
import axios from 'axios'
import { Dictionary } from './types'
import { emitter } from './boot/mitt'

type Service = {
  id: string
  priority: number
  recipientKeys: string[]
  serviceEndpoint: string
  type: string
}

type DIDKeyB58 = {
  did: string
  privateKeyB58: string
  publicKeyB58: string
}

type DIDKey = DIDKeyB58 & {
  privateKey: Buffer
  publicKey: Buffer
}

class ConnectionDetail {
  label: string;
  didDoc: Dictionary;
  myKey: DIDKey;
  didcomm: DIDComm.PackUnpack;
  serviceList: Service[];
  service: Service;

  constructor (label: string, didDoc: Dictionary, myKey: DIDKey) {
    this.label = label
    this.didDoc = didDoc
    this.myKey = myKey

    this.didcomm = new DIDComm.PackUnpack()

    const supportedTypes = ['IndyAgent', 'did-communication']
    this.serviceList = (this.didDoc.service as Service[]).filter(s => supportedTypes.includes(s.type))
    this.service = this.serviceList[0]
  }

  needsReturnRoutePoll () {
    return true
  }

  async sendMessage (msg: Dictionary) {
    if (!('@id' in msg)) {
      msg['@id'] = uuid().toString()
    }
    if (!('~transport' in msg)) {
      msg['~transport'] = { return_route: 'all' }
    }
    console.log(msg)

    const packedMsg = await this.packMessage(msg)

    axios.post(this.service.serviceEndpoint, packedMsg)
      .then(async parsedBody => {
        console.log(parsedBody)
        if (!parsedBody.data) {
          console.log('No response for post; continuing.')
          return
        }
        this.processInbound(await this.unpackMessage(parsedBody.data))
      })
      .catch(function (err) {
        console.error('Error while sending message:', err)
      })
  }

  async packMessage (msg: Dictionary) {
    await this.didcomm.Ready
    const keyPair: sodium.KeyPair = {
      keyType: 'curve25519',
      privateKey: this.myKey.privateKey,
      publicKey: this.myKey.publicKey
    }
    return await this.didcomm.packMessage(
      JSON.stringify(msg),
      [bs58.decode(this.service.recipientKeys[0])],
      keyPair
    )
  }

  async unpackMessage (packedMsg: string): Promise<Dictionary> {
    await this.didcomm.Ready
    const keyPair: sodium.KeyPair = {
      keyType: 'curve25519',
      privateKey: this.myKey.privateKey,
      publicKey: this.myKey.publicKey
    }
    const unpackedResponse = await this.didcomm.unpackMessage(packedMsg, keyPair)
    return JSON.parse(unpackedResponse.message) as Dictionary
  }

  processInbound (msg: Dictionary) {
    emitter.emit('message-received', msg)
  }

  toStore () {
    return {
      label: this.label,
      didDoc: this.didDoc,
      myKeyB58: {
        privateKeyB58: this.myKey.privateKeyB58,
        publicKeyB58: this.myKey.publicKeyB58
      }
    }
  }
}

const newConnection = (label: string, didDoc: Dictionary, myKeyB58: DIDKeyB58): ConnectionDetail => {
  const myKey = Object.assign(myKeyB58, {
    privateKey: bs58.decode(myKeyB58.privateKeyB58),
    publicKey: bs58.decode(myKeyB58.publicKeyB58)
  })
  return new ConnectionDetail(
    label,
    didDoc,
    myKey
  )
}

const connectionFromStore = (obj: Dictionary): ConnectionDetail => {
  return newConnection(
    obj.label,
    obj.didDoc,
    obj.myKeyB58
  )
}

export { ConnectionDetail, newConnection, connectionFromStore, DIDKeyB58 }
