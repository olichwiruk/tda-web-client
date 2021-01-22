<template>
  <q-drawer
    side="right"
    show-if-above
    bordered
    content-class="bg-grey-2"
    v-model="isDrawerOpen"
  >
    <q-scroll-area class="fit">
      <q-list>
        <q-item class="text-h6">Verification requests</q-item>
        <q-separator />

        <q-item v-if="isRefreshing">
          <q-spinner size="xl" />
        </q-item>

        <q-item v-else-if="receivedRequests.length == 0">
          Nothing to show here.
        </q-item>

        <q-item
          v-else
          v-for="req of receivedRequests"
          :key="req.thread_id"
        >

          <q-item-section>
            <q-item-label> {{getTitle(req)}} </q-item-label>
            <q-item-label caption>{{getSubtitle(req)}}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div>
              <q-btn
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
    </q-scroll-area>
  </q-drawer>
</template>

<script lang="ts">
import Vue from 'vue'
import adminApi, { acknowledgePresentationParams } from '@/admin_api.ts';
import share from '@/share';
import axios from 'axios';
import { renderForm } from '@/oca.js-vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  created() {
    this.refreshRequests();
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

      credentialsSchema: {} as any,
      credentialsSchemaAlt: {} as any,
      credentialsLabel: {} as any,
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
    ocaRepoUrl: function (): string {
      // @ts-ignore
      return this.$session.get('ocaRepoUrl')
    },
    presentProofMessages: function (): any[] {
      return this.messages.filter((message: any) => {
        return message.topic == '/topic/present_proof/'
      })
    },
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),

    async refreshRequests() {
      this.isRefreshing = true;
      // @ts-ignore
      this.credentials = (await this.$_adminApi_getCredentials()).data.result;
      // @ts-ignore
      this.requests = (await this.$_adminApi_getPresentations()).data.result;

      this.isRefreshing = false;

      this.$emit('refreshRequests', this.requests);
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

        langBranches.forEach(langBranch => {
          this.credentialsSchemaAlt[presExId].push({
            language: langBranch.lang,
            form: renderForm([
              langBranch.branch.schema_base,
              ...langBranch.branch.overlays]
            ).form
          })
        })
        this.credentialsSchema[presExId] = this.credentialsSchemaAlt[presExId][0].form
        this.credentialsLabel[presExId] = this.credentialsSchema[presExId].label
      } else {
        const r = await axios.get(`${this.ocaRepoUrl}/api/v3/schemas/${requestEl.presentation_request.schema_base_dri}`);

        const branch = r.data
        this.credentialsSchemaAlt[presExId] = []
        const langBranches = this.splitBranchPerLang(branch)

        langBranches.forEach(langBranch => {
          this.credentialsSchemaAlt[presExId].push({
            language: langBranch.lang,
            form: renderForm([
              langBranch.branch.schema_base,
              ...langBranch.branch.overlays]
            ).form
          })
        })
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
      const matchingCredentials = this.credentials.filter(cred => {
        return cred.credential.credentialSubject.oca_schema_dri == request.presentation_request.schema_base_dri
      }).sort((a, b) => {
        if (a.credential.issuanceDate > b.credential.issuanceDate) {
          return -1
        } else if (b.credential.issuanceDate > a.credential.issuanceDate) {
          return 1
        }
        return 0
      });

      if (matchingCredentials.length > 0) {
        const firstCredential = matchingCredentials[0];

        // @ts-ignore
        await this.$_adminApi_sendPresentation({
          credential_id: firstCredential.id,
          exchange_record_id: request.presentation_exchange_id
        });

        // @ts-ignore
        this.$noty.success("Request accepted.", {
          timeout: 5000
        });
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
      
      // @ts-ignore
      await this.$_adminApi_acknowledgePresentation(obj);

      // @ts-ignore
      this.$noty.success("Request rejected.", {
        timeout: 5000
      });

      this.refreshRequests();
    },
  },
})
</script>