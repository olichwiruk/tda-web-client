<template >
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">{{ title }}</a>
      <!-- <el-button -->
      <!--   type="primary" -->
      <!--   icon="el-icon-plus" -->
      <!--   @click="proposalFormActive = true">Send Credential Proposal</el-button> -->
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('cred-refresh',)"></el-button>
    </nav>
    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="credential in credentials"
          :name="credential.credential.issuanceDate"
          :key="credential.credential.issuanceDate">
          <template slot="title">
            {{ credentialsLabel[credential.credential.issuanceDate] }} | {{ credential.credential.issuanceDate }} {{ credential.connection ? `| ${credential.connection.their_label}` : '' }}
          </template>
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="credential">
              </vue-json-pretty>
            </div>
            <el-button v-if="credentialsSchema[credential.credential.issuanceDate]"
              v-on:click="preview(credentialsSchema[credential.credential.issuanceDate], schemaInput[credential.credential.issuanceDate], credentialsSchemaAlt[credential.credential.issuanceDate])">Preview</el-button>
            <el-button v-on:click="collapse_expanded(credential)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <nav
      v-if="offerReceivedStateCredentials.length"
      class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">Offers</a>
      <!-- <el-button
        type="primary"
        icon="el-icon-plus"
        @click="offerFormActive = true">Accept Offer</el-button> -->
    </nav>
    <el-collapse
      v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="credential in offerReceivedStateCredentials"
          v-bind:title="credential.cred_def_id"
          :name="credential.cred_def_id"
          :key="credential.cred_def_id">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="credential">
              </vue-json-pretty>
            </div>
            <el-button v-on:click="collapse_expanded(credential)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <el-dialog title="Propose Credential" :visible.sync="proposalFormActive" @close="deActivateForm()">
      <el-form :model="proposalForm">
        <el-form-item label="Connection:" :label-width="formLabelWidth">
          <el-select
            v-model="proposalForm.connection_id"
            filterable
            value-key="proposalForm.connection_id"
            placeholder="Select">
            <el-option
              v-for="connection in connections"
              :key="connection.connection_id"
              :label="connection.their_label"
              :value="connection.connection_id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Credential Definition:" :label-width="formLabelWidth">
          <el-select
            v-model="proposalForm.selected_cred_def"
            filterable
            value-key="proposalForm.selected_cred_def"
            placeholder="Select"
            :disabled="!proposalForm.connection_id"
            @change="update_attributes">
            <el-option
              v-for="cred_def in cred_defs"
              :key="cred_def.cred_def_id"
              :label="cred_def.cred_def_id"
              :value="cred_def">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="Comment (optional)"
          :label-width="formLabelWidth">
          <el-input
            v-model="proposalForm.comment"
            type="textarea"></el-input>
        </el-form-item>
        <el-form-item
          v-for="attribute in proposalForm.attributes"
          :label="attribute.name"
          :label-width="formLabelWidth"
          :key="attribute.name">
          <el-input
            v-model="attribute.value"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deActivateForm()">Cancel</el-button>
        <el-button :disabled="!proposalForm.selected_cred_def" type="primary" @click="propose">Confirm</el-button>
      </span>
    </el-dialog>

    <preview-component ref="PreviewComponent" :readonly="true" :form="form" :alternatives="alternatives"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import { mapState, mapActions } from 'vuex'
import share from '@/share.ts';
import axios from 'axios';
const hl = require('hashlink');

import { resolveZipFile, renderForm, PreviewComponent } from 'oca.js-vue'

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
    PreviewComponent
  },
  data: () => ({
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
    collapse_expanded: function(credential){
      this.expanded_items = this.expanded_items.filter(
        item => item != credential.id
      );
    },
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
      this.$refs.PreviewComponent.openModal({ label: 'Loading...', sections: [] });
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
      const credential = credentialEl.credential
      let hashlink = credential.credentialSubject.hashlink
      if (hashlink && hashlink.includes('hl:')) {
        const data = await hl.decode({hashlink})
        const exp = data.meta.experimental

        if (exp && exp['schema-base']) {
          this.credentialsSchema[credential.issuanceDate] = []
          const ids = [...exp.overlays, exp['schema-base']]
          ids.forEach(id => {
            axios.get(exp.host + id)
              .then(response => {
                this.credentialsSchema[credential.issuanceDate].push(response.data)
              })
          })
        } else if (exp && exp['dri']) {
          let schemaBaseDri
          axios.get(exp.host + exp['dri'])
            .then(r => {
              const branch = r.data
              this.credentialsSchemaAlt[credential.issuanceDate] = []
              const langBranches = this.splitBranchPerLang(branch)

              langBranches.forEach(langBranch => {
                this.credentialsSchemaAlt[credential.issuanceDate].push({
                  language: langBranch.lang,
                  form: renderForm([
                    langBranch.branch.schema_base,
                    ...langBranch.branch.overlays]
                  ).form
                })
              })
              this.credentialsSchema[credential.issuanceDate] = this.credentialsSchemaAlt[credential.issuanceDate][0].form
              this.credentialsLabel[credential.issuanceDate] = this.credentialsSchema[credential.issuanceDate].label
            })
        }

        const url = data.meta.url[0]
        axios.get(url).then(response => {
          if (exp && (exp['schema-base'] || exp['dri'])) {
            this.schemaInput[credential.issuanceDate] = response.data
          } else if (url.split('.').slice(-1)[0] == 'json') {
            credential.credentialSubject = {...credential.credentialSubject, ...response.data}
          }
        })
      } else if (credential.credentialSubject.oca_schema_dri) {
        const serviceSchema = {
          oca_schema_namespace: credential.credentialSubject.oca_schema_namespace,
          oca_schema_dri: credential.credentialSubject.oca_schema_dri
        }
        axios.get(`${this.ocaRepoUrl}/api/v2/schemas/${serviceSchema.oca_schema_namespace}/${serviceSchema.oca_schema_dri}`)
          .then(r => {
            const branch = r.data
            this.credentialsSchemaAlt[credential.issuanceDate] = []
            const langBranches = this.splitBranchPerLang(branch)

            langBranches.forEach(langBranch => {
              this.credentialsSchemaAlt[credential.issuanceDate].push({
                language: langBranch.lang,
                form: renderForm([
                  langBranch.branch.schema_base,
                  ...langBranch.branch.overlays]
                ).form
              })
            })
            this.credentialsSchema[credential.issuanceDate] = this.credentialsSchemaAlt[credential.issuanceDate][0].form
            this.credentialsLabel[credential.issuanceDate] = this.credentialsSchema[credential.issuanceDate].label
          })

        if(credential.credentialSubject.oca_data_dri) {
          const schemaPayload = (await axios.get(`${this.acapyApiUrl}/pds/${credential.credentialSubject.oca_data_dri}`)).data.payload
          this.schemaInput[credential.issuanceDate] = Object.values(schemaPayload)[0].p
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
        this.$emit('cred-refresh',)
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
      }).sort((a, b) => {
        if (a.credential.issuanceDate < b.credential.issuanceDate) {
          return 1
        } else if (a.credential.issuanceDate > b.credential.issuanceDate) {
          return -1
        }
        return 0
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
    receivedStateCredentials(){
      return this.credentials
      /*
        .filter(
        cred =>
          "state" in cred &&
          cred.state === "credential_received" ||
          cred.state === "stored" ||
          cred.state === "credential_acked"
      )
      */
    },
    storedStateCredentials(){
      return this.credentials.filter(cred => "state" in cred && cred.state === "stored")
    },
  }
}
</script>
