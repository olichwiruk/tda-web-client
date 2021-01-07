<template>
  <div>
    <el-dialog :title="title" :visible.sync="active" @close="deactivate()">
      <el-form>
        <el-form-item
          label="OCA Schema:"
          :label-width="formLabelWidth">

          <vue-typeahead-bootstrap
            v-model="search.query"
            :minMatchingChars="0"
            :showOnFocus="true"
            :data="search.matching.length == 0 ? search.all : search.matching"
            :serializer="s => `${s.namespace} / ${s.schemaName}`"
            @hit="getOcaSchema"
            style="width: 100%;">

            <template slot="append">
              <el-button
              slot="append"
              class="btn-sm"
              icon="el-icon-search"
              v-show="search.query && ocaForm"
              @click="preview()">Preview</el-button>
            </template>

            <template slot="suggestion" slot-scope="{ data, htmlText }">
              <span v-html="htmlText"></span>
            </template>
          </vue-typeahead-bootstrap>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="deactivate()">Cancel</el-button>
        <el-button :disabled="!ocaForm" type="primary" @click="request_pesentation">Request</el-button>
      </span>
    </el-dialog>

    <preview-component style="z-index: 9999;" ref="PreviewComponent" :readonly="true" :form="ocaForm" :alternatives="ocaFormAlternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios'
import { renderForm, PreviewComponent } from 'oca.js-vue'

import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'

export default {
  name: 'presentation-request-dialog',
  props: { title: String },
  components: { VueTypeaheadBootstrap, PreviewComponent },
  data() {
    return {
      active: false,
      search: {
        query: '',
        all: [],
        matching: [],
        selected: null
      },
      ocaForm: null,
      ocaFormAlternatives: [],
      formLabelWidth: '200px',
    }
  },
  computed: {
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
  },
  watch: {
    'search.query': function(input) {
      if(input.length == 0) {
        this.ocaForm = null
      }
      this.fetchOcaSchemas(input)
    },
  },
  methods: {
    deactivate() {
      this.active = false
    },
    request_pesentation() {
      this.$emit('presentation-requested', {
        oca_schema_dri: this.search.selected.DRI
      })
      this.deactivate()
    },
    fetchOcaSchemas: function(input) {
      axios.get(`${this.ocaRepoUrl}/api/v2/schemas?suggest=${input}`)
        .then(r => {
          this.search.matching = r.data.map(x => {
            return {
              namespace: x.namespace,
              DRI: x.DRI,
              schemaName: x.schema.name
            }
          })
        })
    },
    getOcaSchema: async function(schema) {
      this.ocaFormAlternatives = []
      const result = await axios.get(`${this.ocaRepoUrl}/api/v2/schemas?_index=branch&schema_base=${schema.DRI}`)
      const branchesBase = result.data.filter(e => e.namespace == schema.namespace)
      const branchBase = branchesBase[0]
      this.search.selected = {
        namespace: branchBase.namespace,
        DRI: branchBase.DRI,
        schemaName: schema.schemaName
      }

      const branchResponse = await axios.get(`${this.ocaRepoUrl}/api/v2/schemas/${branchBase.namespace}/${branchBase.DRI}`)
      const branch = branchResponse.data
      const langBranches = this.splitBranchPerLang(branch)

      try {
        langBranches.forEach(langBranch => {
          this.ocaFormAlternatives.push({
            language: langBranch.lang,
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays]).form
          })
        })

        this.ocaForm = this.ocaFormAlternatives[0].form
      } catch(e) {
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
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
    preview(formInput = null) {
      try {
        this.$refs.PreviewComponent.openModal(this.ocaForm, formInput);
      } catch(e) {
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
  }
}
</script>

<style scoped>
</style>
