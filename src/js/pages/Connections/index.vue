<template>
  <q-page class="q-pa-xl">
    <div>
    <q-dialog v-model="isQrDialogVisible">
      <q-card>
        <q-card-section>
          <div class="text-h6">Scan QR-Code</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <qr-stream
            v-if="isQrDialogVisible"
            @decode="onQrScan"
          ></qr-stream>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isUrlDialogVisible">
      <q-card class="invitation-url-card">
        <q-card-section>
          <div class="text-h6">Invitation URL</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            dense
            v-model="invitation"
            autofocus
            hint="https://example.com"
            @keyup.enter="prompt = false"
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            flat
            label="Cancel"
            v-close-popup
          />
          <q-btn
            flat
            label="Connect"
            @click="recieveInvitation"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-8">
        <q-card>
          <q-banner inline-actions>
            <span class="text-h5"> Contacts</span>
            <template v-slot:action>
              <!-- <custom-spinner :show="isRefreshing" /> -->

              <q-btn
                flat
                dense
                icon="add"
                @click="isUrlDialogVisible = true"
              ></q-btn>
              <q-btn
                flat
                dense
                icon="qr_code_scanner"
                @click="isQrDialogVisible = true"
              ></q-btn>
              <q-btn
                flat
                dense
                icon="refresh"
                @click="fetchConnections"
              ></q-btn>
            </template>
          </q-banner>

          <q-list v-if="activeConnections.length === 0">
            <q-item>
              Add your first contact by scanning a QR-Code or adding it manually.
            </q-item>
          </q-list>
          <template v-else>
            <connection-list
              title="Active Connections:"
              editable="true"
              class="activeConnections"
              :list="activeConnections"
              @refresh="fetchConnections"
              @connection-deleted="delete_connection"
            ></connection-list>
              <!-- @connection-editted="update_connection" -->
            <!-- <connection-list -->
            <!--   title="Pending Connections:" -->
            <!--   editable="true" -->
            <!--   :list="pending_connections" -->
            <!--   @connection-editted="update_connection" -->
            <!--   @connection-deleted="delete_connection" -->
            <!-- ></connection-list> -->
            <!-- <connection-list -->
            <!--   title="Failed Connections:" -->
            <!--   editable="false" -->
            <!--   :list="failed_connections" -->
            <!--   @connection-editted="update_connection" -->
            <!--   @connection-deleted="delete_connection" -->
            <!-- ></connection-list> -->
          </template>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card>
          <q-banner inline-actions>
            <span class="text-h5">Invitation</span>
          </q-banner>

          <q-card-section v-if="invitationUrl" >
            <p>
              This invitation can be used to share with other contacts.
            </p>

            <q-input
              v-model="invitationUrl"
              readonly
              filled
            >
              <template v-slot:append>
                <q-btn
                  v-if="canShare"
                  round
                  dense
                  flat
                  icon="share"
                  @click="shareWithSystemDialog(invitationUrl)"
                />
                <q-btn
                  v-else
                  round
                  dense
                  flat
                  icon="content_copy"
                  @click="copyToClipboard(invitationUrl)"
                />
              </template>
            </q-input>

            <div class="q-my-xl" />

            <div class="text-center">
              <div>
                <qrcode
                  :value="invitationUrl"
                  :size="qrCodeSize"
                  level="L"
                  ref="qrcodeRef"
                ></qrcode>
              </div>
              <q-btn
                flat
                icon="print"
                @click="printQrCode"
              >Print QR-Code</q-btn>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
  </q-page>
</template>

<script>
import ConnectionList from './ConnectionList.vue';

import QrcodeVue from 'qrcode.vue';
import { QrStream } from 'vue3-qr-reader'

import CustomSpinner from '../../components/Spinner/CustomSpinner';
import { copyToClipboard } from 'quasar';
import { mapState, mapGetters, mapActions } from 'vuex';

import { connectionFromStore } from '../../../connection_detail'
import Storage from '../../../storage'

let connection
const agentConnection = Storage.get(Storage.Record.AgentConnection)
if (agentConnection) {
  connection = connectionFromStore(JSON.parse(agentConnection))
}

export default {
  name: 'connections',
  components: {
    ConnectionList,
    QrStream,
    qrcode: QrcodeVue,
    CustomSpinner,
  },
  data: function() {
    return {
      invite: null,
      isRefreshing: false,
      invitation: '',
      isQrDialogVisible: false,
      isUrlDialogVisible: false,
      qrCodeSize: 200,
    }
  },
  created: async function() {
    this.fetchConnections()

    if (!this.invite) {
      this.fetchNewInvite()
    }
  },
  computed: {
    ...mapState('agentCommunication', ['invitationUrl', 'messages']),
    ...mapGetters('agentCommunication', ['activeConnections']),
    ...mapGetters('wsMessages', ['connectionMessages']),
    canShare() {
      return !!navigator.canShare
    }
  },
  watch: {
    messages: {
      handler: function () {
        const prefix = `did:sov:BzCbsNYhMrjHiqZDTUASHg;spec`
        this.messages.forEach(msg => {
          if (msg['@type'] === `${prefix}/admin-connections/0.1/connection` ||
            msg['@type'] === `${prefix}/admin-connections/0.1/ack`) {
            this.fetchConnections()
            this.removeMessage(msg['@id'])
          }
        })
      },
      deep: true
    },
    connectionMessages: {
      handler: function () {
        this.connectionMessages.forEach(message => {
          this.fetchConnections()
          this.deleteMessage(message.uuid)
        })
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('agentCommunication', ['removeMessage']),
    ...mapActions('wsMessages', ['deleteMessage']),
    fetchConnections: function() {
      connection.sendMessage({
        '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/connection-get-list'
      })
    },
    async fetchNewInvite() {
      const msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/create-invitation",
        "label": connection.label,
        "role": '',
        "auto_accept": 'auto',
        "public": false,
        "multi_use": false,
      };

      connection.sendMessage(msg);
    },
    recieveInvitation: function() {
      const msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/receive-invitation",
        "invitation": this.invitation,
        "auto_accept": "auto"
      };
      connection.sendMessage(msg);
      this.invitation = "";
    },
    async copyToClipboard(text) {
      try {
        await copyToClipboard(text);

        this.$notify.success('Invitation URL has been copied to clipboard.')
      } catch(e) {
        console.error(e)
        this.$notify.error('Invitation URL could not be copied to clipboard.')
      }
    },
    printQrCode() {
      const windowSize = this.qrCodeSize + 25;

      var dataUrl = this.$refs.qrcodeRef.$el.toDataURL();
      var windowContent = '<!DOCTYPE html>';
      windowContent += '<html>'
      windowContent += '<head><title>Print QR-Code</title></head>';
      windowContent += '<body>'
      windowContent += '<img src="' + dataUrl + '">';
      windowContent += '</body>';
      windowContent += '</html>';
      var printWin = window.open('', '', `width=${windowSize},height=${windowSize}`);
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.focus();
      printWin.print();
    },
    shareWithSystemDialog(text) {
      try {
        navigator.share(text);
      }
      catch (e) {
        console.error(e)
        this.$notify.success('Could not share URL.')
      }
    },
    /*
    update_connection: function(form) {
      let query_msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/update",
        "connection_id": form.connection_id,
        "label": form.label,
        "role": form.role,
      };
      this.send_message(query_msg);
    },
  */
    delete_connection: function(selectedConnection) {
      let query_msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/delete",
        "connection_id": selectedConnection.connection_id,
      };
      connection.sendMessage(query_msg);
    },
    onQrScan: function (decodedString) {
      /*
      try {
        // only if string can be parsed as url, we will accept it
        new URL(decodedString);
      } catch {
        return;
      }

      this.isQrDialogVisible = false;
      this.invitation = decodedString;
      this.recieve_invitation();
      */
    },
  },
}
</script>

<style scoped>
.invitation-url-card {
  min-width: 40vw;
}
</style>

