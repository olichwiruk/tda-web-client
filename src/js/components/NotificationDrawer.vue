<template>
  <q-drawer
    side="right"
    show-if-above
    bordered
    content-class="bg-white"
    v-model="isDrawerOpen"
    :width="350"
  >
    <q-scroll-area class="fit">
      <q-list>
        <q-item class="text-h5">Verification requests</q-item>
        <!-- <q-separator /> -->

        <!-- <q-item v-if="isRefreshing"> -->
        <!--   <q-spinner size="xl" /> -->
        <!-- </q-item> -->
        <q-separator />

        <q-item v-if="receivedRequests.length == 0">
          Nothing to show here.
        </q-item>

        <q-item
          v-else
          v-for="req of receivedRequests"
          :key="req.thread_id"
        >
          <q-item-section side>
            <div v-if="!hasMatchingCredential(req)">
              <q-icon
                name="warning"
                size="md"
                color="red"
              >
                <q-tooltip>We could not find a matching credential.</q-tooltip>
              </q-icon>
            </div>
            <div v-else>
              <q-avatar
                color="teal"
                size="md"
                icon="shield"
                text-color="white"
              />
            </div>
          </q-item-section>

          <q-item-section>
            <q-item-label> {{getTitle(req)}} </q-item-label>
            <q-item-label caption>{{getSubtitle(req)}}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div>
              <q-btn
                v-if="hasMatchingCredential(req)"
                icon="done"
                flat
                round
                @click="sendCredential(req)"
              >
                <q-tooltip>Accept</q-tooltip>
              </q-btn>

              <q-btn
                icon="clear"
                flat
                round
                @click="rejectCredential(req)"
              >
                <q-tooltip>Reject</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <q-list>
        <q-item class="text-h6">
          Presentations
          <!-- <custom-spinner -->
          <!--   class="q-ml-md" -->
          <!--   :show="isRefreshing" -->
          <!-- /> -->
        </q-item>
        <q-separator />

        <q-item v-if="receivedPresentations.length == 0">
          Nothing to show here.
        </q-item>

        <q-item
          v-else
          v-for="pres of receivedPresentations"
          :key="pres.thread_id"
        >

          <q-item-section>
            <q-item-label> {{getTitle(pres)}} </q-item-label>
            <q-item-label caption>{{getSubtitle(pres)}}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div>
              <q-btn
                icon="preview"
                flat
                round
                @click="showPresentation(pres)" >
                <q-tooltip>Show</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>

    <preview-component ref="PreviewComponent" :readonly="true" :reviewable="true"
      :form="form" :alternatives="alternatives"
      confirmLabel="Confirm" :confirmProcessing="confirmProcessing"
      rejectLabel="Reject" :rejectProcessing="rejectProcessing">
    </preview-component>
  </q-drawer>
</template>

<script>
import adminApi from '../admin_api';
import axios from 'axios';
import { renderForm, PreviewComponent } from '../oca.js-vue';
import { mapActions, mapState, mapGetters } from 'vuex';
//import CustomSpinner from './Spinner/CustomSpinner.vue';
import Storage from '../../storage'

export default {
  components: {
    //CustomSpinner,
    PreviewComponent,
  },
  created() {
    this.refreshRequests();
  },
  mounted() {
    this.establishListeners()
  },
  mixins: [
    adminApi
  ],
  props: {
    isOpen: Boolean,
  },
  data() {
    return {
      requests: [],
      credentials: [],
      isRefreshing: false,
      isDrawerOpen: false,

      presExId: null,
      form: {},
      alternatives: [],
      confirmProcessing: false,
      rejectProcessing: false,

      credentialsSchema: {},
      credentialsSchemaAlt: {},
      credentialsLabel: {},
      schemaPayload: {},
      schemaPayloadDri: {}
    }
  },
  watch: {
    requests: function () {
      this.requests.forEach(async (request) => {
        await this.generatePreview(request)
      })
    },
    isOpen: function (val) {
      if (this.isDrawerOpen !== val)
        this.isDrawerOpen = val;
    },
    isDrawerOpen: function (val) {
      this.$emit('toggleDrawer', val);

      if (val) {
        this.refreshRequests();
      }
    },
    presentProofMessages: {
      handler: function () {
        this.presentProofMessages.forEach(msg => {
          this.deleteMessage(msg.uuid)
        });

        this.refreshRequests();
      }
    },
    pdsPayloadMessages: {
      handler: function() {
        this.pdsPayloadMessages.forEach(msg => {
          this.schemaPayload[msg.content.dri] = JSON.parse(msg.content.payload)
          this.deleteMessage(msg.uuid)
        })
      }
    },
  },
  computed: {
    ...mapState('wsMessages', ['messages']),
    ...mapGetters('agentCommunication', ['activeConnections']),

    receivedRequests() {
      return this.requests.filter(
        exchange =>
          "state" in exchange &&
          exchange.state === "request_received" &&
          //==========================================
          "role" in exchange &&
          "prover" === exchange.role)
    },
    receivedPresentations() {
      return this.requests.filter(
        exchange =>
          "state" in exchange &&
          exchange.state === "presentation_received" &&
          //==========================================
          "role" in exchange &&
          "verifier" === exchange.role)
    },
    ocaRepoUrl () {
      return Storage.get(Storage.Record.OcaRepoUrl)
    },
    presentProofMessages () {
      return this.messages.filter((message) => {
        return message.topic == '/topic/present_proof/'
      })
    },
    pdsPayloadMessages() {
      return this.messages.filter(message => {
        return message.topic == '/topic/pds/payload/'
      })
    },
  },
  methods: {
    ...mapActions('wsMessages', ['deleteMessage']),

    async refreshRequests() {
      this.isRefreshing = true;

      const [
        credentialResponse,
        presentationResponse
      ] = await Promise.all([
        this.$_adminApi_getCredentials(),
        this.$_adminApi_getPresentations(),
      ]);

      this.credentials = credentialResponse.data.result;
      this.requests = presentationResponse.data.result;

      this.isRefreshing = false;

      this.$emit('refreshRequests', this.receivedRequests);
    },
    getTitle(request) {
      const conn = this.activeConnections.find(c => c.connection_id == request.connection_id);
      if (conn) {
        return conn.their_label;
      } else {
        return ''
      }
    },
    getSubtitle(request) {
      // \u00a0 is nonbreaking space -> it helps reducing flickering
      return this.credentialsLabel[request.presentation_exchange_id] || '\u00a0';
    },
    hasMatchingCredential(request) {
      return request.list_of_matching_credentials.length > 0;
    },
    getMatchingCredential(request) {
      const matching = this.credentials.filter(cred => {
        return request.list_of_matching_credentials.includes(cred.dri)
      }).sort((a, b) => {
        if (a.timestamp > b.timestamp) {
          return -1
        } else if (b.timestamp > a.timestamp) {
          return 1
        }
        return 0
      });

      if (matching.length > 0)
        // always returns the first matching credential if possible
        return matching[0];
    },
    showPresentation(presentation) {
      this.establishListeners()
      const presExId = presentation.presentation_exchange_id
      this.previewedPresExId = presExId
      this.form = this.credentialsSchema[presExId]
      this.alternatives = this.credentialsSchemaAlt[presExId]

      let input
      if (this.schemaPayloadDri[presExId]) {
        input = this.schemaPayload[this.schemaPayloadDri[presExId]]
      }

      this.$refs.PreviewComponent.openModal(this.form, input);
    },
    async confirmHandler() {
      const params = {
        exchange_record_id: this.previewedPresExId,
        status: true
      };

      try {
        await this.$_adminApi_acknowledgePresentation(params);

        this.$notify.success('Presentation accepted.')
      }
      catch (e) {
        console.error(e)
        this.notify.error('Could not accept presentation.')
      }
    },
    async rejectHandler() {
      const params = {
        exchange_record_id: this.previewedPresExId,
        status: false
      };

      try {
        await this.$_adminApi_acknowledgePresentation(params);

        this.$notify.success('Presentation rejected.')
      }
      catch (e) {
        console.error(e)
        this.$notify.error('Could not reject presentation.')
      }

      this.refreshRequests();
    },

    /***************************************************/

    async generatePreview (requestEl) {
      if (!requestEl) { return }
      const presExId = requestEl.presentation_exchange_id
      const request = requestEl.presentation
      if (request) {
        const credential = Object.values(request.verifiableCredential)[0]
        const serviceSchema = {
          oca_schema_namespace: credential.credentialSubject.oca_schema_namespace,
          oca_schema_dri: credential.credentialSubject.oca_schema_dri
        }

        const r = await axios.get(`${this.ocaRepoUrl}/api/v2/schemas/${serviceSchema.oca_schema_namespace}/${serviceSchema.oca_schema_dri}`);
        const branch = r.data
        this.credentialsSchemaAlt[presExId] = []
        const langBranches = this.splitBranchPerLang(branch)

        this.credentialsSchemaAlt[presExId] = await Promise.all(
          langBranches.map(async (langBranch) => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              serviceSchema.oca_schema_dri
            )).form
          }))
        );
        this.credentialsSchema[presExId] = this.credentialsSchemaAlt[presExId][0].form
        this.credentialsLabel[presExId] = this.credentialsSchema[presExId].label

        if(credential.credentialSubject.oca_data_dri) {
          this.schemaPayloadDri[presExId] = credential.credentialSubject.oca_data_dri
          if (!this.schemaPayload[this.schemaPayloadDri[presExId]]) {
            this.$_adminApi_askForPayload({
              connection_id: requestEl.connection_id,
              payload_id: credential.credentialSubject.oca_data_dri
            })
          }
        }
      } else {
        const r = await axios.get(`${this.ocaRepoUrl}/api/v3/schemas/${requestEl.presentation_request.schema_base_dri}`);

        const branch = r.data
        this.credentialsSchemaAlt[presExId] = []
        const langBranches = this.splitBranchPerLang(branch)

        this.credentialsSchemaAlt[presExId] = await Promise.all(
          langBranches.map(async (langBranch) => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              requestEl.presentation_request.schema_base_dri
            )).form
          })
        ));
        this.credentialsSchema[presExId] = this.credentialsSchemaAlt[presExId][0].form
        this.credentialsLabel[presExId] = this.credentialsSchema[presExId].label

      }

      // this.$forceUpdate();
    },
    splitBranchPerLang: function (branch) {
      const langBranches = []
      const labelOverlays = branch.overlays.filter((o) => o.type.includes("label"))
      const languages = labelOverlays.map((o) => o.language)
      const schemaBase = branch.schema_base
      languages.forEach((lang) => {
        langBranches.push({
          lang: lang,
          branch: {
            schema_base: schemaBase,
            overlays: branch.overlays.filter((o) => {
              if (!o.language) { return true }
              return o.language == lang
            })
          }
        })
      })
      return langBranches
    },
    establishListeners() {
      this.$emitter.all.delete('oca-form.save_preview')
      this.$emitter.on('oca-form.save_preview', this.confirmHandler)
      this.$emitter.all.delete('oca-form.reject_preview')
      this.$emitter.on('oca-form.reject_preview', this.rejectHandler)
    },
    async sendCredential(request) {
      const matching = this.getMatchingCredential(request);

      if (matching) {
        try {
          await this.$_adminApi_sendPresentation({
            credential_id: matching.dri,
            exchange_record_id: request.presentation_exchange_id
          });

          this.$notify.success('Request accepted.')
        }
        catch (e) {
          console.error(e)
          this.notify.error('Could not accept request.')
        }
      } else {
        console.error(e)
        this.$notify.error('No matching credential found.')
      }

      this.refreshRequests();
    },
    async rejectCredential(request) {
      const obj = {
        exchange_record_id: request.presentation_exchange_id,
        status: false,
      };

      try {
        await this.$_adminApi_acknowledgePresentation(obj);

        this.$notify.success("Request rejected.")
      }
      catch (e) {
        console.error(e)
        this.$notify.error('Could not reject request.')
      }

      this.refreshRequests();
    },
  },
}
</script>
