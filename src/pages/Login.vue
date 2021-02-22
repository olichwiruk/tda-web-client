<template>
  <q-layout>
    <q-page-container>
      <q-page class="center">
        <q-card flat>
          <header class="text-h4 text-center q-pa-lg">
            Trusted Digital Assistant
          </header>
          <q-linear-progress indeterminate />
          <div class="q-pa-lg space-between">
            <q-img
              class="q-ma-md logo-image"
              :src="oydImageUrl"
            />
            <q-img
              class="q-ma-md logo-image"
              :src="hcfImageUrl"
            />
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import hcfLogo from '../assets/logo_hcf.png'
import oydLogo from '../assets/logo_oyd.png'
import * as bs58 from 'bs58'
import { Base64 } from 'js-base64'
import * as DIDComm from 'pack-unpack'
import { v4 as uuid } from 'uuid'
import axios from 'axios'
import { Dictionary } from '../types'
import { ConnectionDetail, newConnection, DIDKeyB58 } from '../connection_detail'
import Storage from '../storage'

type Invitation = {
  '@id': string
  '@type': string
  label: string
  recipientKeys: string[]
  serviceEndpoint: string
}

export default class Login extends Vue {
  invitationUrl = this.routeParams.get('invitation_url')

  get hcfImageUrl () { return hcfLogo }
  get oydImageUrl () { return oydLogo }
  get routeParams () {
    return (new URL(document.location.href)).searchParams
  }

  get isLoggedIn () {
    return !!Storage.get(Storage.Record.AgentConnection)
  }

  async created () {
    if (this.isLoggedIn) {
      this.routeToMainScreen()
    } else {
      await this.connectToAgent()
    }
  }

  routeToMainScreen () {
    window.location.href = window.location.href.split('?')[0]
    this.$router.push({
      name: 'agent'
    }).catch(e => console.error(e))
  }

  async connectToAgent () {
    if (this.invitationUrl) {
      const invitationUrlParams = (new URL(this.invitationUrl)).searchParams
      const inviteB64 = invitationUrlParams.get('c_i')
      if (!inviteB64) { return }
      const invite = JSON.parse(Base64.decode(inviteB64)) as Invitation
      await this.ackInvitation(invite)
    }
  }

  async ackInvitation (invite: Invitation) {
    const didcomm = new DIDComm.PackUnpack()
    await didcomm.Ready
    const didPair = await didcomm.generateKeyPair()

    const tdaDID: DIDKeyB58 = {
      did: bs58.encode(Buffer.from(didPair.publicKey.subarray(0, 16))),
      publicKeyB58: bs58.encode(Buffer.from(didPair.publicKey)),
      privateKeyB58: bs58.encode(Buffer.from(didPair.privateKey))
    }

    const request = this.generateInvitationRequest(tdaDID) as Dictionary

    const packedMessage = await didcomm.packMessage(
      JSON.stringify(request),
      [bs58.decode(invite.recipientKeys[0])],
      didPair
    )

    axios.post(invite.serviceEndpoint, packedMessage)
      .then(async r => {
        console.log(r)
        const unpackedResponse = await didcomm.unpackMessage(r.data, didPair)
        const response = JSON.parse(unpackedResponse.message) as Dictionary

        const buff = Buffer.from((response['connection~sig'] as Dictionary).sig_data, 'base64')
        const text = buff.toString('ascii')
        // first 8 chars are a timestamp for the signature,
        // so we ignore those before parsing value
        response.connection = JSON.parse(text.substring(8)) as Dictionary

        const connectionDetail: ConnectionDetail = newConnection(
          invite.label, (response.connection as Dictionary).DIDDoc, tdaDID
        )

        Storage.set(Storage.Record.AgentConnection, JSON.stringify(connectionDetail.toStore()))
        this.routeToMainScreen()
      })
      .catch(e => console.error(e))
  }

  generateInvitationRequest (tdaDID: DIDKeyB58) {
    return {
      '@id': (uuid().toString()),
      '~transport': {
        return_route: 'all'
      },
      '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/request',
      label: 'TDA',
      connection: {
        DID: tdaDID.did,
        DIDDoc: {
          '@context': 'https://w3id.org/did/v1',
          id: tdaDID.did,
          publicKey: [{
            id: tdaDID.did + '#keys-1',
            type: 'Ed25519VerificationKey2018',
            controller: tdaDID.did,
            publicKeyBase58: tdaDID.publicKeyB58
          }],
          service: [{
            id: tdaDID.did + ';indy',
            type: 'IndyAgent',
            recipientKeys: [tdaDID.publicKeyB58],
            serviceEndpoint: ''
          }]
        }
      }
    }
  }
}
</script>

<style scoped>
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.space-between {
  display: flex;
  justify-content: space-between;
}
</style>
