<template >
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">{{ title }}</a>
      <el-button
        type="primary"
        icon="el-icon-plus"
        @click="proposalFormActive = true">Send Credential Proposal</el-button>
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('cred-refresh',)"></el-button>
    </nav>
    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="credential in credentials"
          v-bind:title="credential.referent"
          :name="credential.referent"
          :key="credential.referent">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=1
                :data="credential">
              </vue-json-pretty>
            </div>
            <el-button v-if="credentialsSchema[credential.referent]"
              v-on:click="preview(credentialsSchema[credential.referent], schemaInput[credential.referent])">Preview</el-button>
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
                :deep=1
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

    <preview-component ref="PreviewComponent" readonly="true" :form="form"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import share from '@/share.js';
import axios from 'axios';
const hl = require('hashlink');

import { resolveZipFile, renderForm, PreviewComponent } from 'odca-form'

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
    credentialsSchema: {},
    schemaInput: {},
    form: null
  }),
  methods: {
    collapse_expanded: function(credential){
      this.expanded_items = this.expanded_items.filter(
        item => item != credential.credential_exchange_id
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
    preview(schema, input) {
      this.$refs.PreviewComponent.openModal({ label: 'Loading...', sections: [] });
      try {
          this.form = renderForm(schema).form
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
    }
  },
  watch: {
    credentials: function() {
      this.credentialsSchema = {}
      this.schemaInput = {}
      this.credentials.forEach(async (credential) => {
        let hashlink = credential.attrs.hashlink
        if (hashlink && hashlink.includes('hl:')) {
          const data = await hl.decode({hashlink})
          const exp = data.meta.experimental

          if (exp && exp['schema-base']) {
            this.credentialsSchema[credential.referent] = []
            const ids = [...exp.overlays, exp['schema-base']]
            ids.forEach(id => {
              axios.get(exp.host + id)
                .then(response => {
                  this.credentialsSchema[credential.referent].push(response.data)
                })
            })
          }

          const url = data.meta.url[0]
          axios.get(url)
            .then(response => {
              if (exp && exp['schema-base']) {
                this.schemaInput[credential.referent] = response.data
              } else if (url.split('.').slice(-1)[0] == 'json') {
                credential.attrs = {...credential.attrs, ...response.data}
              }
            })
        }
      })
    },
  },
  computed: {
    credentials: function() {
      return this.list.map(item => {
        if (item.connection_id in this.id_to_connection) {
          item.connection = this.id_to_connection[item.connection_id];
        } else {
          item.connection = null;
        }
        return item;
      });
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
