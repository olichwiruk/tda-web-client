<template >
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">{{ title }}</a>
      <vue-bootstrap-typeahead 
        v-model="ocaSchemaQuery"
        :minMatchingChars="0"
        :data="ocaSchemaSearch || []"
        :serializer="s => s.schemaName"
        @hit="getOcaSchema"
        style="width: 400px;">
        <template slot="append">
          <el-button
          slot="append"
          icon="el-icon-search"
          v-show="ocaSchema && ocaSchemaQuery"
          @click="preview">Preview</el-button>
        </template>

        <template slot="suggestion" slot-scope="{ data, htmlText }">
          <small>{{ data.namespace }}/</small><span v-html="htmlText"></span>
        </template>
      </vue-bootstrap-typeahead>
      <el-button
        type="primary"
        icon="el-icon-plus"
        v-show="ocaSchema && ocaSchemaQuery"
        @click="issueFormActive = true">Issue</el-button>
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('schema-refresh',)"></el-button>
    </nav>

    <el-dialog title="Issue Credential" :visible.sync="issueFormActive" @close="deActivateForm()">
      <el-form :model="issueForm">
        <el-form-item label="Connection:" :label-width="formLabelWidth">
          <el-select
            v-model="issueForm.connection_id"
            filterable
            value-key="issueForm.connection_id"
            placeholder="Select">
            <el-option
              v-for="connection in available_connections"
              :key="connection.connection_id"
              :label="connection.their_label"
              :value="connection.connection_id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="Comment (optional)"
          :label-width="formLabelWidth">
          <el-input
            v-model="issueForm.comment"
            type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deActivateForm()">Cancel</el-button>
        <el-button :disabled="!issueForm.connection_id" type="primary" @click="fillOcaForm">Next</el-button>
      </span>
    </el-dialog>

    <preview-component ref="PreviewComponent" :readonly="true" :form="ocaForm"></preview-component>
    <preview-component ref="OcaFormComponent" :form="ocaForm"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
import axios from 'axios'

import { eventBus as ocaEventBus, EventHandlerConstant,
  renderForm, PreviewComponent } from 'odca-form'

export default {
  name: 'oca-schema-list',
  props: ['title', 'connections'],
  components: {
    VueJsonPretty,
    VueBootstrapTypeahead,
    PreviewComponent
  },
  data () {
    return {
      issueFormActive: false,
      issueForm: {
        connection_id: '',
        connection_label: '',
        comment: ''
      },
      formLabelWidth: '200px',
      ocaSchemaQuery: '',
      ocaSchemaSearch: [],
      ocaSchema: null,
      ocaForm: null
    }
  },
  watch: {
    ocaSchemaQuery: function(input) {
      if(input.length == 0) {
        this.ocaSchema = null
      }
      this.fetchOcaSchemas(input)
    },
    'issueForm.connection_id': function(connection_id) {
      const selectedConnection = this.available_connections.find(c => {
        return c.connection_id == connection_id
      })
      if(selectedConnection) {
        this.issueForm.connection_label = selectedConnection.their_label
      }
    },
  },
  computed: {
    available_connections: function() {
      return this.connections.filter(c => c.their_label != 'ToolBox')
    },
  },
  mounted() {
    this.ocaSchemaSearch = this.fetchOcaSchemas('')

    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, (r) => {
      console.log(r)
    })
  },
  methods: {
    deActivateForm: function() {
      this.issueFormActive = false
      this.issueForm = {
        connection_id: '',
        connection_label: '',
        comment: ''
      };
    },
    fillOcaForm: function() {
      this.issueFormActive = false

      try {
          this.$refs.OcaFormComponent.openModal({
            ...this.ocaForm,
            label: `${this.ocaForm.label} for ${this.issueForm.connection_label}`
          });
      } catch {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    fetchOcaSchemas: function(input) {
        axios.get(`http://localhost:9292/v2/schemas?_index=schema_base&q=${input}`)
        .then(r => {
          this.ocaSchemaSearch = r.data.map(x => {
            return {
              namespace: x.namespace,
              DRI: x.DRI,
              schemaName: x.schema.name
            }
          })
        })
    },
    getOcaSchema: async function(schema) {
      const result = await axios.get(`http://localhost:9292/v2/schemas?_index=branch&schema_base=${schema.DRI}`)
      const branch = result.data.find(e => e.namespace == schema.namespace)

      const branchResponse = await axios.get(`http://localhost:9292/v2/schemas/${branch.namespace}/${branch.DRI}`)
      this.ocaSchema = branchResponse.data
      try {
          this.ocaForm = renderForm(
            [this.ocaSchema.schema_base, ...this.ocaSchema.overlays]
          ).form
      } catch {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    preview() {
      try {
          this.$refs.PreviewComponent.openModal(this.ocaForm);
      } catch {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    }
  }
}
</script>
