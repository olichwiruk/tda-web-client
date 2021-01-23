<template>
  <div style="display: flex;">
    <label class="el-form-item__label">{{ label }}</label>
    <!-- <vue-typeahead-bootstrap -->
    <!--   v-model="search.query" -->
    <!--   :minMatchingChars="0" -->
    <!--   :showOnFocus="true" -->
    <!--   :data="search.matching.length == 0 ? search.all : search.matching" -->
    <!--   :serializer="s => `${s.namespace} / ${s.schemaName}`" -->
    <!--   @hit="getOcaSchema" -->
    <!--   style="width: 500px;"> -->

    <!--   <template slot="append"> -->
    <!--     <el-button -->
    <!--     slot="append" -->
    <!--     class="btn-sm" -->
    <!--     icon="el-icon-search" -->
    <!--     v-show="search.query" -->
    <!--     @click="preview()">Preview</el-button> -->
    <!--   </template> -->

    <!--   <template slot="suggestion" slot-scope="{ data, htmlText }"> -->
    <!--     <span v-html="htmlText"></span> -->
    <!--   </template> -->
    <!-- </vue-typeahead-bootstrap> -->

    <q-btn label="Confirm" color="primary" @click="preview()" />
    <preview-component style="z-index: 9999;" ref="PreviewComponent" :readonly="true" :form="ocaForm" :alternatives="ocaFormAlternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios'

import { renderForm, PreviewComponent } from '@/oca.js-vue'

export default {
  name: 'oca-schema-search',
  props: ['ocaRepoHost', 'label'],
  components: {
    PreviewComponent
  },
  data() {
    return {
      search: {
        query: '',
        all: [],
        matching: [],
        selected: null
      },
      ocaForm: null,
      ocaFormAlternatives: [],
    }
  },
  watch: {
    'search.query': function(input) {
      if(input.length == 0) {}
      this.fetchOcaSchemas(input)
    },
    'search.selected': function() {
      this.getOcaSchema(this.search.selected)
    }
  },
  async created() {
    axios.get(`${this.ocaRepoHost}/api/v2/schemas/consent?_index=schema_base&limit=7`)
      .then(r => {
        this.search.all = r.data.map(x => {
          return {
            namespace: x.namespace,
            DRI: x.DRI,
            schemaName: x.schema.name
          }
        })
        this.search.matching = this.search.all
        this.search.selected = this.search.all[0]
      })


    let schema = ( await axios.get(`https://repository.oca.argo.colossi.network/api/v3/schemas/8crS4tLkgghLfCrp7hePBN7M61SLqixvtfq1CMvhUHjW`) ).data;

    console.log(schema);
    this.ocaForm = (await renderForm([schema.schema_base, ...schema.overlays])).form;
  },
  methods: {
    fetchOcaSchemas: function(input) {
      axios.get(`${this.ocaRepoHost}/api/v2/schemas?suggest=${input}`)
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
      const result = await axios.get(`${this.ocaRepoHost}/api/v2/schemas?_index=branch&schema_base=${schema.DRI}`)
      const branchesBase = result.data.filter(e => e.namespace == schema.namespace)
      const branchBase = branchesBase[0]
      this.$emit('consentSchemaSelected', {
        namespace: branchBase.namespace,
        DRI: branchBase.DRI,
        schemaName: schema.schemaName
      })
      this.search.query = `${branchBase.namespace} / ${schema.schemaName}`

      const branchResponse = await axios.get(`${this.ocaRepoHost}/api/v2/schemas/${branchBase.namespace}/${branchBase.DRI}`)
      const branch = branchResponse.data
      const langBranches = this.splitBranchPerLang(branch)

      try {
        this.ocaFormAlternatives = await Promise.all(
          langBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays])).form
          })
        ));

        this.ocaForm = this.ocaFormAlternatives[0].form
        this.$emit('consentFormRendered', {
          form: this.ocaForm, formAlternatives: this.ocaFormAlternatives
        })
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
