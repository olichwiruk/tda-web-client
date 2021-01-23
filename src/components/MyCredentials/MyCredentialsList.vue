<template>
  <div class="q-pa-md q-gutter-md col">
    <div class="row">
      <div class="bg-white text-grey-8 col">
        <q-toolbar>
          <div class="row wrap">
            <q-input
              dense
              outlined
              square
              v-model="search"
              placeholder="Search"
              class="bg-white col"
            />
            <q-btn
              class=""
              color="grey-3"
              text-color="grey-8"
              icon="search"
              unelevated
            />
          </div>
          <q-btn
            color="primary"
            icon="refresh"
            @click="$emit('cred-refresh')"
          ></q-btn>
        </q-toolbar>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="q-pa-md row items-start q-gutter-md">
          <FlipCard v-for="credential in credentials">
            <template slot="front">
              <q-card-section horizontal>
                <div class="text-overline">{{ credential.content.type }}</div>
              </q-card-section>
              <q-separator />

              <q-card-actions vertical>
                <q-btn flat>
                  Valid until 2025-10-13
                </q-btn>
                <q-btn flat color="primary">
                  Issued by {{ credential.content.issuer }}
                  on
                  {{ credential.content.issuanceDate }}
                </q-btn>

                <q-btn flat color="info" @click="preview(
                  credentialsSchema[credential.dri],
                  schemaInput[credential.dri],
                  credentialsSchemaAlt[credential.dri]
                )">
                  Preview
                </q-btn>
              </q-card-actions>
            </template>
            <template slot="back">
              <q-card-section horizontal>
                <div class="q-pa-md">
                  <div class="q-gutter-y-md" style="min-width:300px; max-width:400px">
                      <q-tabs
                        v-model="tab"
                        dense
                        class="text-gray"
                        active-color="primary"
                        indicator-color="primary"
                        align="justify"
                        narrow-indicator
                      >
                        <q-tab name="raw" label="Raw" />
                        <q-tab name="scan" label="Scan" />
                      </q-tabs>
                      <q-separator />
                      <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="raw">
                          <q-scroll-area
                            style="height: 200px; max-width: 400px;"
                          >
                            <vue-json-pretty :deep="0" :data="credential">
                            </vue-json-pretty>
                          </q-scroll-area>
                        </q-tab-panel>

                        <q-tab-panel name="scan">
                          <qrcode
                            v-bind:value="ScanMe"
                            :options="{ width: 200 }"
                          ></qrcode>
                        </q-tab-panel>
                      </q-tab-panels>
                  </div>
                </div>
              </q-card-section>
            </template>
          </FlipCard>
        </div>
      </div>
    </div>

    <preview-component ref="PreviewComponent" :alternatives="alternatives" :form="form"
      :readonly="true" :reviewable="false"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import FlipCard from '@/components/FlipCard';
import { mapState, mapActions } from 'vuex'
import share from '@/share.ts';
import axios from 'axios';
const hl = require('hashlink');
import VueQrcode from '@chenfengyuan/vue-qrcode';

import { renderForm, PreviewComponent } from '@/oca.js-vue'

export default {
  name: 'my-credentials-list',
  props: [
    'title',
    'editable',
    'list',
    'connections',
    'cred_defs'
    ],
  mixins: [share({use: ['id_to_connection']})],
  components: {
    VueJsonPretty,
    FlipCard,
    'qrcode': VueQrcode,
    PreviewComponent
  },
  data: () => ({
    tab: "scan",
    search: "",
    expanded_items:[],
    proposalFormActive: false,
    proposalForm: {
      connection_id: '',
      selected_cred_def: null,
      comment: '',
      attributes: []
    },
    formLabelWidth: '200px',
    credentialsLabel: {},
    credentialsSchema: {},
    credentialsSchemaAlt: {},
    schemaInput: {},
    form: null,
    alternatives: null
  }),
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
    deActivateForm: function() {
      this.proposalFormActive = false;
      this.proposalForm = {
        connection_id: '',
        selected_cred_def: null,
        comment: '',
        attributes: []
      };
    },
    propose: function() {
      let values = {
        connection_id: this.proposalForm.connection_id,
        cred_def_id: this.proposalForm.selected_cred_def.cred_def_id,
        comment: this.proposalForm.comment,
        attributes: this.proposalForm.attributes,
      }
      this.proposalForm.connection_id = '';
      this.proposalForm.selected_cred_def = {};
      this.proposalForm.comment = '';
      this.proposalForm.attributes = [];

      this.$emit('propose', values);
      this.proposalFormActive = false;
    },
    preview(schema, input, alternatives) {
      this.alternatives = alternatives
      // this.$refs.PreviewComponent.openModal({ label: 'Loading...', sections: [] });
      try {
          this.form = schema
          this.$refs.PreviewComponent.openModal(this.form, input);
      } catch {
          this.$refs.PreviewComponent.closeModal()
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    update_attributes: function(cred_def) {
      var comp = this;
      comp.proposalForm.attributes = [];
      cred_def.attributes.forEach(name => {
        comp.proposalForm.attributes.push({
          name: name,
          value: ''
        });
      });
    },
    credential_title: function(cred) {
      let split = cred.schema_id.split(':');
      let connection_name = '';
      if (!cred.connection) {
        connection_name = '[deleted]';
      } else {
        connection_name = cred.connection.their_label;
      }
      return `${split[2]} v${split[3]} received from ${connection_name}`;
    },
    generatePreview: async function(credentialEl) {
      const credential = credentialEl.content
      let hashlink = credential.credentialSubject.hashlink
      if (hashlink && hashlink.includes('hl:')) {
        const data = await hl.decode({hashlink})
        const exp = data.meta.experimental

        if (exp && exp['schema-base']) {
          this.credentialsSchema[credentialEl.dri] = []
          const ids = [...exp.overlays, exp['schema-base']]
          ids.forEach(id => {
            axios.get(exp.host + id)
              .then(response => {
                this.credentialsSchema[credentialEl.dri].push(response.data)
              })
          })
        } else if (exp && exp['dri']) {
          let schemaBaseDri
          axios.get(exp.host + exp['dri'])
            .then(async r => {
              const branch = r.data
              this.credentialsSchemaAlt[credentialEl.dri] = []
              const langBranches = this.splitBranchPerLang(branch)

              this.credentialsSchemaAlt[credentialEl.dri] = await Promise.all(
                langBranches.map(async langBranch => ({
                  language: langBranch.lang,
                  form: (await renderForm(
                    [langBranch.branch.schema_base, ...langBranch.branch.overlays]
                  )).form
                }))
              )
              this.credentialsSchema[credentialEl.dri] = this.credentialsSchemaAlt[credentialEl.dri][0].form
              this.credentialsLabel[credentialEl.dri] = this.credentialsSchema[credentialEl.dri].label
            })
        }

        const url = data.meta.url[0]
        axios.get(url).then(response => {
          if (exp && (exp['schema-base'] || exp['dri'])) {
            this.schemaInput[credentialEl.dri] = response.data
          } else if (url.split('.').slice(-1)[0] == 'json') {
            credential.credentialSubject = {...credential.credentialSubject, ...response.data}
          }
        })
      } else if (credential.credentialSubject.oca_schema_dri) {
        console.log(credential, "<<<<<<<<<<<<<<<<<<<<<")
        const serviceSchema = {
          oca_schema_namespace: credential.credentialSubject.oca_schema_namespace,
          oca_schema_dri: credential.credentialSubject.oca_schema_dri
        }
        const branch = (await axios.get(`${this.ocaRepoUrl}/api/v3/schemas/${serviceSchema.oca_schema_dri}`)).data
        const langBranches = this.splitBranchPerLang(branch)

        this.credentialsSchemaAlt[credentialEl.dri] = await Promise.all(
          langBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              serviceSchema.oca_schema_dri
            )).form
          }))
        )
        this.credentialsSchema[credentialEl.dri] = this.credentialsSchemaAlt[credentialEl.dri][0].form
        this.credentialsLabel[credentialEl.dri] = this.credentialsSchema[credentialEl.dri].label

        if(credential.credentialSubject.oca_data) {
          this.schemaInput[credentialEl.dri] = credential.credentialSubject.oca_data
        } else if(credential.credentialSubject.oca_data_dri) {
          this.schemaInput[credentialEl.dri] = (await axios.get(`${this.acapyApiUrl}/pds/${credential.credentialSubject.oca_data_dri}`)).data.payload
        }
      }
    },
    splitBranchPerLang: function(branch) {
      const langBranches = []
      const labelOverlays = branch.overlays.filter(o => o.type.includes("label"))
      const languages = labelOverlays.map(o => o.language)
      const schemaBase = branch.schema_base
      languages.forEach(lang => {
        langBranches.push({
          lang: lang,
          branch: {
            schema_base: schemaBase,
            overlays: branch.overlays.filter(o => {
              if(!o.language) { return true }
              return o.language == lang
            })
          }
        })
      })
      return langBranches
    },
  },
  watch: {
    credentialMessages: {
      handler: function() {
        this.credentialMessages.forEach(message => {
          if (message.content.state == 'credential_received') {
            this.$emit('cred-refresh',)
          }
          this.delete_message(message.uuid)
        })
      },
      deep: true
    },
    credentials: function() {
      this.credentials.forEach(async (credential) => {
        await this.generatePreview(credential)
      })
      if (this.credentials.length != Object.keys(this.credentialsLabel).length) {
     //   this.$emit('cred-refresh',)
      }
    },
  },
  computed: {
    ...mapState("WsMessages", ['messages']),
    credentialMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/issue_credential/'
      })
    },
    credentials: function() {
      return this.list.map(item => {
        if (item.issuer && item.issuer.split(':')[0] === "did") {
          item.connection = this.connections.find(conn => {
            return conn.their_did == item.issuer.split(':')[2]
          })
        } else {
          item.connection = null;
        }
        return item;
      });
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    offerReceivedStateCredentials(){
      return this.credentials.filter(cred => "state" in cred && cred.state === "offer_received")
    },
    sentRequestStateCredentials(){
      return this.credentials.filter(cred => "state" in cred && cred.state === "request_sent")
    },
    storedStateCredentials(){
      return this.credentials.filter(cred => "state" in cred && cred.state === "stored")
    },
  }
}
</script>
