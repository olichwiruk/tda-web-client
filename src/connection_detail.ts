import * as DIDComm from 'pack-unpack'
import * as bs58 from 'bs58'
import { Dictionary } from './types'

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

const connectionFromStore = (obj: Dictionary) => {
  return newConnection(
    obj.label,
    obj.didDoc,
    obj.myKeyB58
  )
}

export { ConnectionDetail, newConnection, connectionFromStore, DIDKeyB58 }
