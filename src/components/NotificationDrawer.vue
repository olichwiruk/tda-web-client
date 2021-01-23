<template>
  <q-drawer
    side="right"
    show-if-above
    bordered
    content-class="bg-grey-2"
    v-model="isDrawerOpen"
    width="350"
  >
    <q-scroll-area class="fit">
      <q-list>
        <q-item class="text-h5">Verification requests</q-item>
        <q-separator />

        <q-item v-if="isRefreshing">
          <q-spinner size="xl" />
        </q-item>
        <q-separator />

        <q-item v-if="receivedRequests.length == 0">
          Nothing to show here.
        </q-item>

        <q-item
          v-else
          v-for="req of receivedRequests"
          :key="req.thread_id"
        >
          <q-item-section
            side
            v-if="!hasMatchingCredential(req)"
          >
            <q-icon
              name="warning"
              size="sm"
              color="red"
            >
              <q-tooltip>We could not find a matching credential.</q-tooltip>
            </q-icon>
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
          <custom-spinner
            class="q-ml-md"
            :show="isRefreshing"
          />
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

<script lang="ts">
import Vue from 'vue'
import adminApi, { acknowledgePresentationParams } from '@/admin_api.ts';
import share from '@/share';
import axios from 'axios';
import { eventBus as ocaEventBus, EventHandlerConstant,
  renderForm, PreviewComponent } from '@/oca.js-vue';
import { mapActions, mapState } from 'vuex';
import CustomSpinner from './Spinner/CustomSpinner.vue';

export default Vue.extend({
  components: {
    CustomSpinner,
    PreviewComponent,
  },
  created() {
    this.refreshRequests();
  },
  mounted() {
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.confirmHandler)
    ocaEventBus.$off(EventHandlerConstant.REJECT_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.REJECT_PREVIEW, this.rejectHandler)
  },
  mixins: [
    adminApi,
    share({
      // @ts-ignore
      use: ['active_connections'],
    }),
  ],
  props: {
    isOpen: Boolean,
  },
  data() {
    return {
      requests: [] as any[],
      credentials: [] as any[],
      isRefreshing: false,
      isDrawerOpen: false,

      presExId: null,
      form: {},
      alternatives: [],
      confirmProcessing: false,
      rejectProcessing: false,

      credentialsSchema: {} as any,
      credentialsSchemaAlt: {} as any,
      credentialsLabel: {} as any,
      schemaPayload: {} as any,
      schemaPayloadDri: {} as any,
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

      if (val)
        this.refreshRequests();
    },
    presentProofMessages: {
      handler: function () {
        this.presentProofMessages.forEach(msg => {
          this.delete_message(msg.uuid)
        });

        this.refreshRequests();
      }
    },
    pdsPayloadMessages: {
      handler: function() {
        this.pdsPayloadMessages.forEach(msg => {
          this.schemaPayload[msg.content.dri] = JSON.parse(msg.content.payload)
          this.delete_message(msg.uuid)
        })
      }
    },
  },
  computed: {
    ...mapState('WsMessages', ['messages']),

    receivedRequests(): any[] {
      return this.requests.filter(
        exchange =>
          "state" in exchange &&
          exchange.state === "request_received" &&
          //==========================================
          "role" in exchange &&
          "prover" === exchange.role)
    },
    receivedPresentations(): any[] {
      return this.requests.filter(
        exchange =>
          "state" in exchange &&
          exchange.state === "presentation_received" &&
          //==========================================
          "role" in exchange &&
          "verifier" === exchange.role)
    },
    ocaRepoUrl: function (): string {
      // @ts-ignore
      return this.$session.get('ocaRepoUrl')
    },
    presentProofMessages: function (): any[] {
      return this.messages.filter((message: any) => {
        return message.topic == '/topic/present_proof/'
      })
    },
    pdsPayloadMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/pds/payload/'
      })
    },
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),

    async refreshRequests() {
      this.isRefreshing = true;

      const [
        credentialResponse,
        presentationResponse
      ] = await Promise.all([
        // @ts-ignore
        this.$_adminApi_getCredentials(),
        // @ts-ignore
        this.$_adminApi_getPresentations(),
      ]);

      this.credentials = credentialResponse.data.result;
      this.requests = presentationResponse.data.result;

      this.isRefreshing = false;

      this.$emit('refreshRequests', this.receivedRequests);
    },
    getTitle(request: any): string {
      // @ts-ignore
      const conn = this.active_connections.find(c => c.connection_id == request.connection_id);
      return conn.their_label;
    },
    getSubtitle(request: any): string {
      // \u00a0 is nonbreaking space -> it helps reducing flickering
      return this.credentialsLabel[request.presentation_exchange_id] || '\u00a0';
    },
    hasMatchingCredential(request: any): boolean {
      return request.list_of_matching_credentials.length > 0;
    },
    getMatchingCredential(request: any): any {
      const matching = this.credentials.filter(cred => {
        return request.list_of_matching_credentials.includes(cred.dri)
      }).sort((a, b) => {
        if (a.credential.issuanceDate > b.credential.issuanceDate) {
          return -1
        } else if (b.credential.issuanceDate > a.credential.issuanceDate) {
          return 1
        }
        return 0
      });

      if (matching.length > 0)
        // always returns the first matching credential if possible
        return matching[0];
    },
    showPresentation(presentation) {
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
      const params: acknowledgePresentationParams = {
        exchange_record_id: this.previewedPresExId,
        status: true
      };

      try {
        // @ts-ignore
        await this.$_adminApi_acknowledgePresentation(params);

        // @ts-ignore
        this.$noty.success("Presentation accepted.", {
          timeout: 5000
        });
      }
      catch {
        // @ts-ignore
        this.$noty.error("Could not accept presentation.", {
          timeout: 5000,
        });
      }
    },
    async rejectHandler() {
      const params: acknowledgePresentationParams = {
        exchange_record_id: this.previewedPresExId,
        status: false
      };

      try {
        // @ts-ignore
        await this.$_adminApi_acknowledgePresentation(params);

        // @ts-ignore
        this.$noty.success("Presentation rejected.", {
          timeout: 5000
        });
      }
      catch {
        // @ts-ignore
        this.$noty.error("Could not reject presentation.", {
          timeout: 5000,
        });
      }

      this.refreshRequests();
    },

    /***************************************************/

    generatePreview: async function (requestEl: any) {
      const presExId = requestEl.presentation_exchange_id
      const request = requestEl.presentation
      if (request) {
        const credential: any = Object.values(request.verifiableCredential)[0]
        const serviceSchema = {
          oca_schema_namespace: credential.credentialSubject.oca_schema_namespace,
          oca_schema_dri: credential.credentialSubject.oca_schema_dri
        }

        const r = await axios.get(`${this.ocaRepoUrl}/api/v2/schemas/${serviceSchema.oca_schema_namespace}/${serviceSchema.oca_schema_dri}`);
        const branch = r.data
        this.credentialsSchemaAlt[presExId] = []
        const langBranches = this.splitBranchPerLang(branch)

        this.credentialsSchemaAlt[presExId] = await Promise.all(
          langBranches.map(async (langBranch: any) => ({
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
          langBranches.map(async (langBranch: any) => ({
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

      this.$forceUpdate();
    },
    splitBranchPerLang: function (branch: any) {
      const langBranches: any[] = []
      const labelOverlays = branch.overlays.filter((o: any) => o.type.includes("label"))
      const languages = labelOverlays.map((o: any) => o.language)
      const schemaBase = branch.schema_base
      languages.forEach((lang: any) => {
        langBranches.push({
          lang: lang,
          branch: {
            schema_base: schemaBase,
            overlays: branch.overlays.filter((o: any) => {
              if (!o.language) { return true }
              return o.language == lang
            })
          }
        })
      })
      return langBranches
    },
    async sendCredential(request: any) {
      const matching = this.getMatchingCredential(request);

      if (matching) {
        try {
          // @ts-ignore
          await this.$_adminApi_sendPresentation({
            credential_id: matching.dri,
            exchange_record_id: request.presentation_exchange_id
          });

          // @ts-ignore
          this.$noty.success("Request accepted.", {
            timeout: 5000
          });
        }
        catch {
          // @ts-ignore
          this.$noty.error("Could not accept request.", {
            timeout: 5000
          });
        }
      } else {
        // @ts-ignore
        this.$noty.error("No matching credential found.", {
          timeout: 5000
        });
      }

      this.refreshRequests();
    },
    async rejectCredential(request: any) {
      const obj: acknowledgePresentationParams = {
        exchange_record_id: request.presentation_exchange_id,
        status: false,
      };

      try {
        /*
        // @ts-ignore
        await this.$_adminApi_acknowledgePresentation(obj);

        // @ts-ignore
        this.$noty.success("Request rejected.", {
          timeout: 5000
        });
        */
      }
      catch {
        // @ts-ignore
        this.$noty.error("Could not reject request.", {
          timeout: 5000,
        });
      }

      this.refreshRequests();
    },
  },
})
</script>