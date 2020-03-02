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
        @click="createFormActive = true">Create</el-button>
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('schema-refresh',)"></el-button>
    </nav>

    <preview-component ref="PreviewComponent" :readonly="true" :form="ocaForm"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
import axios from 'axios'

import { renderForm, PreviewComponent } from 'odca-form'

export default {
  name: 'oca-schema-list',
  props: ['title'],
  components: {
    VueJsonPretty,
    VueBootstrapTypeahead,
    PreviewComponent
  },
  data () {
    return {
      createFormActive: false,
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
  },
  mounted() {
    this.ocaSchemaSearch = this.fetchOcaSchemas('')
  },
  methods: {
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

      axios.get(`http://localhost:9292/v2/schemas/${branch.namespace}/${branch.DRI}`)
        .then(r => this.ocaSchema = r.data)
    },
    preview() {
      try {
          this.ocaForm = renderForm([this.ocaSchema.schema_base, ...this.ocaSchema.overlays]).form
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
