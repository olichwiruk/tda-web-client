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

<template>
  <q-layout>
    <q-page-container>
      <q-page class="center">
        <q-card flat>
          <header class="text-h4 text-center q-pa-lg">Trusted Digital Assistant</header>
          <q-linear-progress indeterminate />
          <div class="q-pa-lg space-between">
            <q-img class="q-ma-md" :src="hcfImageUrl" />
            <q-img class="q-ma-md" :src="oydImageUrl" />
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
  <!--
  <el-row>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">Aries Toolbox</a>
    </nav>

    <div class="alert alert-danger" v-if="defaultConnectionEstablished == false">
      Connection to Agent failed. Please contact with administrator or try again later.
    </div>

    <el-card shadow="never" class="agent-card" v-for="a in agent_list">
      <span slot="header"><strong>{{a.label}}</strong></span>
      <div>
        <el-button type="text" @click="openConnection(a)">Open</el-button>
        <el-button type="text" @click="deleteConnection(a)">Delete</el-button>
      </div>
    </el-card>

    <el-card shadow="never" id="new_agent_connection">
      <span slot="header">New Agent Connection</span>
      <div>
        <el-form :inline="true">
          <el-input v-model="new_agent_invitation" placeholder="Paste agent invitation"></el-input>
          <el-button type="primary" @click="new_agent_invitation_process">Connect</el-button>
        </el-form>
      </div>
    </el-card>
  </el-row>
  -->
</template>

<script>
const bs58 = require('bs58');
const rp = require('request-promise');
const DIDComm = require('encryption-envelope-js');
//import DIDComm from 'didcomm-js';
import { mapState, mapActions } from "vuex"
import { new_connection } from '../connection_detail.ts';
import axios from 'axios';
import axiosRetry from 'axios-retry';
const uuidv4 = require('uuid/v4');

export default {
  name: 'agent-list',
  components: {  },
  data() {
    return {
      agent: this.routeParams().get('agent'),
      uuid: this.routeParams().get('uuid'),
      invitation_url: this.routeParams().get('invitation_url'),
      agentServiceEndpoint: '',
      defaultConnectionEstablished: null,
      new_agent_invitation: "",
      splashScreenTimeout: null,
    }
  },
  computed: {
    ...mapState("Agents", ["agent_list"]),
    acapyApiUrl: function() {
      const temp = this.agentServiceEndpoint.split('.')
      temp[0] = temp[0].concat('-api')
      return temp.join('.')
    },
    localDataVaultUrl: function() {
      const tempURL = new URL(this.agentServiceEndpoint)
      const temp = tempURL.host.split('.')
      const t0 = temp[0].split('-')
      t0.pop()
      t0.push(config.env.VUE_APP_DATA_VAULT)
      temp[0] = t0.join('-')
      return `${tempURL.protocol}//${temp.join('.')}`
    },
    ocaRepoUrl: function() {
      if(config.env.VUE_APP_OCA_REPO_URL) {
        return config.env.VUE_APP_OCA_REPO_URL
      } else {
        return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_OCA_REPO}.${config.env.VUE_APP_HOST}`
      }
    },
    hcfImageUrl: function () {
      return require('../assets/logo_hcf.png');
    },
    oydImageUrl: function () {
      return require('../assets/logo_oyd.png');
    }
  },
  created() {
    // this is the minimum time the splash screen must be shown
    this.splashScreenTimeout = new Promise(resolve => setTimeout(() => resolve(), 1000));

    if(this.invitation_url) {
      this.agentServiceEndpoint = (new URL(this.invitation_url)).origin
      this.new_agent_invitation = this.invitation_url
      this.new_agent_invitation_process()
      this.defaultConnectionEstablished = true
    } else if(this.agent) {
      const a = this.uuid ? `${this.uuid}-${this.agent}` : this.agent
      this.agentServiceEndpoint = `${config.env.VUE_APP_PROTOCOL}://${a}.${config.env.VUE_APP_HOST}`
      this.connectDefaultAgent()
    }

    if (!this.$session.get('agentId')) { return; }

    this.routeToMainScreen(this.$session.get('agentId'));
  },
  watch: {
    agent_list: {
      handler() {
        const agent = this.agent_list[0]
        this.openConnection(agent)
      }
    }
  },
  methods: {
    ...mapActions("Agents", ["add_agent", "delete_agent"]),
    routeParams() {
      return (new URL(document.location)).searchParams;
    },
    async routeToMainScreen(agentid) {
      // we have wait for our timeout
      // otherwise the splash screen might be flickery for users
      await this.splashScreenTimeout;

      this.$router.push({
        name: 'agent', params: {
          agentid,
        }
      });
    },
    connectDefaultAgent() {
      const axiosInstance = axios.create()
      axiosRetry(axiosInstance, {
        retries: 5,
        shouldResetTimeout: true,
        retryDelay: retryCount => (retryCount * 500)
      })

      axiosInstance.post(
        `${this.acapyApiUrl}/connections/create-admin-invitation-url`,
        { timeout: 1000 }
      ).then(r => {
        const invitationUrl = r.data.invitation_url
        if (!invitationUrl) { throw 'Error' }
        this.new_agent_invitation = invitationUrl
        this.new_agent_invitation_process()
        this.defaultConnectionEstablished = true
      }).catch(() => this.defaultConnectionEstablished = false)
    },
    openConnection: async function(a) {
      axios.get(`${this.acapyApiUrl}/info`).then(r => {
        const agentWsUrl = r.data.websocket_server_url
        this.$session.set('websocketUrl', agentWsUrl)
      })

      this.$session.set('agentLabel', a.label)
      this.$session.set('agentId', a.id)
      this.$session.set('agentLabel', a.label)
      this.$session.set('acapyApiUrl', this.acapyApiUrl)
      this.$session.set('localDataVaultUrl', this.localDataVaultUrl)
      this.$session.set('ocaRepoUrl', this.ocaRepoUrl)

      this.routeToMainScreen(a.id);
    },
    deleteConnection: async function(a){
      this.delete_agent(a);
    },
    async new_agent_invitation_process(){
      if (this.agentServiceEndpoint.length == 0) {
        this.agentServiceEndpoint = (new URL(this.new_agent_invitation)).origin
      }

      //process invite, prepare request
      var vm = this; //hang on to view model reference
      this.new_agent_invitation = this.new_agent_invitation.replace(' ', '')
      console.log("invite", this.new_agent_invitation);
      //extract c_i param
      function getUrlVars(url) {
        var vars = {};
        var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
          vars[key] = value;
        });
        return vars;
      }
      /*
       * JavaScript base64 / base64url encoder and decoder
       */

      var b64c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"   // base64 dictionary
      var b64u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"   // base64url dictionary
      var b64pad = '='
      /* base64_encode_data
       * Internal helper to encode data to base64 using specified dictionary.
       */
      function base64_encode_data(data, len, b64x) {
        var dst = ""
        var i

        for (i = 0; i <= len - 3; i += 3)
        {
          dst += b64x.charAt(data.charCodeAt(i) >>> 2)
          dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i+1) >>> 4))
          dst += b64x.charAt(((data.charCodeAt(i+1) & 15) << 2) | (data.charCodeAt(i+2) >>> 6))
          dst += b64x.charAt(data.charCodeAt(i+2) & 63)
        }

        if (len % 3 == 2)
        {
          dst += b64x.charAt(data.charCodeAt(i) >>> 2)
          dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i+1) >>> 4))
          dst += b64x.charAt(((data.charCodeAt(i+1) & 15) << 2))
          dst += b64pad
        }
        else if (len % 3 == 1)
        {
          dst += b64x.charAt(data.charCodeAt(i) >>> 2)
          dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4))
          dst += b64pad
          dst += b64pad
        }

        return dst
      }

      /* base64_encode
       * Encode a JavaScript string to base64.
       * Specified string is first converted from JavaScript UCS-2 to UTF-8.
       */
      function base64_encode(str) {
        var utf8str = unescape(encodeURIComponent(str))
        return base64_encode_data(utf8str, utf8str.length, b64c)
      }

      /* base64url_encode
       * Encode a JavaScript string to base64url.
       * Specified string is first converted from JavaScript UCS-2 to UTF-8.
       */
      function base64url_encode(str) {
        var utf8str = unescape(encodeURIComponent(str))
        return base64_encode_data(utf8str, utf8str.length, b64u)
      }

      /* base64_charIndex
       * Internal helper to translate a base64 character to its integer index.
       */
      function base64_charIndex(c) {
        if (c == "+") return 62
        if (c == "/") return 63
        return b64u.indexOf(c)
      }

      /* base64_decode
       * Decode a base64 or base64url string to a JavaScript string.
       * Input is assumed to be a base64/base64url encoded UTF-8 string.
       * Returned result is a JavaScript (UCS-2) string.
       */
      function base64_decode(data) {
        var dst = ""
        var i, a, b, c, d, z

        for (i = 0; i < data.length - 3; i += 4) {
          a = base64_charIndex(data.charAt(i+0))
          b = base64_charIndex(data.charAt(i+1))
          c = base64_charIndex(data.charAt(i+2))
          d = base64_charIndex(data.charAt(i+3))

          dst += String.fromCharCode((a << 2) | (b >>> 4))
          if (data.charAt(i+2) != b64pad)
            dst += String.fromCharCode(((b << 4) & 0xF0) | ((c >>> 2) & 0x0F))
          if (data.charAt(i+3) != b64pad)
            dst += String.fromCharCode(((c << 6) & 0xC0) | d)
        }

        dst = decodeURIComponent(escape(dst))
        return dst
      }

      /* base64url_sniff
       * Check whether specified base64 string contains base64url specific characters.
       * Return true if specified string is base64url encoded, false otherwise.
       */
      function base64url_sniff(base64) {
        if (base64.indexOf("-") >= 0) return true
        if (base64.indexOf("_") >= 0) return true
        return false
      }
      var invite_b64 = getUrlVars(this.new_agent_invitation)["c_i"];
      console.log("invite b64", invite_b64);
      //base 64 decode
      var invite_string = base64_decode(invite_b64);
      console.log("invite string", invite_string);
      var invite = JSON.parse(invite_string);
      console.log("invite", invite);

      //make a did
      const didcomm = new DIDComm.DIDComm();
      await didcomm.Ready;
      const toolbox_did = await didcomm.generateKeyPair();
      toolbox_did.did = bs58.encode(Buffer.from(toolbox_did.publicKey.subarray(0, 16)));
      toolbox_did.publicKey_b58 = bs58.encode(Buffer.from(toolbox_did.publicKey));
      toolbox_did.privateKey_b58 = bs58.encode(Buffer.from(toolbox_did.privateKey));
      console.log("new pair", toolbox_did);

      var req = {
        "@id":  (uuidv4().toString()),
        "~transport": {
          "return_route": "all"
        },
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0/request",
        "label": "ToolBox",
        "connection": {
          "DID": toolbox_did.did,
          "DIDDoc": {
            "@context": "https://w3id.org/did/v1",
            "id": toolbox_did.did,
            "publicKey": [{
              "id": toolbox_did.did + "#keys-1",
              "type": "Ed25519VerificationKey2018",
              "controller": toolbox_did.did,
              "publicKeyBase58": toolbox_did.publicKey_b58
            }],
            "service": [{
              "id": toolbox_did.did + ";indy",
              "type": "IndyAgent",
              "recipientKeys": [toolbox_did.publicKey_b58],
              //"routingKeys": ["<example-agency-verkey>"],
              "serviceEndpoint": ""
            }]
          }
        }
      };
      console.log("Exchange Request", req);

      //send request, look for response
      const packedMsg = await didcomm.packMessage(JSON.stringify(req), [bs58.decode(invite.recipientKeys[0])], toolbox_did, true);
      console.log("Packed Exchange Request", packedMsg);

      //send request
      var options = {
        method: 'POST',
        uri: invite.serviceEndpoint,
        body: packedMsg
      };

      rp(options)
        .then(async function (parsedBody) {
          // POST succeeded...
          const unpackedResponse = await didcomm.unpackMessage(parsedBody, toolbox_did);
          //console.log("unpacked", unpackedResponse);
          const response = JSON.parse(unpackedResponse.message);
          //console.log("response message", response);
          //TODO: Validate signature against invite.
          //console.log("connection sig b64 data", response['connection~sig'].sig_data);
          let buff = new Buffer(response['connection~sig'].sig_data, 'base64');
          let text = buff.toString('ascii');
          //first 8 chars are a timestamp for the signature, so we ignore those before parsing value
          response.connection = JSON.parse(text.substring(8));
          console.log("response message", response);
          //TODO: record endpoint and recipient key in connection record, along with my keypair. use invitation label
          // TODO: Clear invite box fter new add.
          let connection_detail = new_connection(invite.label, response.connection.DIDDoc, toolbox_did);
          console.log("connection detail", connection_detail);
          ///this.$store.Connections.commit("ADD_CONNECTION", connection_detail);
          const connections = vm.$session.get('connections') || []
          connections.push(connection_detail.to_store())
          vm.$session.set('connections', connections)
          vm.add_agent(connection_detail.to_store());
          vm.new_agent_invitation = ""; //clear input for next round
        })
        .catch(function (err) {
          // POST failed...
          console.log("request post err", err);
        });
    }

  }
}
</script>

<style>
.agent-card:first-of-type {
  margin-top: .5em;
}
.agent-card, #new_agent_connection {
  margin: .5em 1em;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
.agent-card .el-card__header,
#new_agent_connection .el-card__header {
  padding: .75rem 1.25rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}
.agent-card .el-card__body {
  padding: 0 1em;
}
</style>
