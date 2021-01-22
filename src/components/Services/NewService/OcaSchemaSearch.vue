<template>
  <div>
    <q-select
      outlined
      v-model="search.query"
      use-input
      input-debounce="250"
      :label="label"
      :option-label="s => !!s ? `${s.namespace} / ${s.schemaName}`: ''"
      :options="search.matching.length == 0 ? search.all : search.matching"
      @filter="fetchOcaSchemas"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            No results
          </q-item-section>
        </q-item>
      </template>

      <template v-slot:after>
        <q-btn
          :disable="!ocaForm"
          round
          dense
          flat
          icon="preview"
          @click="preview()"
        />
      </template>
    </q-select>

    <preview-component
      style="z-index: 9999;"
      ref="PreviewComponent"
      :readonly="true"
      :form="ocaForm"
      :alternatives="ocaFormAlternatives"
    ></preview-component>
  </div>
</template>

<script>
import axios from 'axios'

import { renderForm, PreviewComponent } from '@/oca.js-vue'

export default {
  name: 'oca-schema-search',
  props: ['ocaRepoHost', 'label'],
  components: {
    PreviewComponent,
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
    'search.query': function (input) {
      this.getOcaSchema(input);
    },
  },
  created() {
    axios.get(`${this.ocaRepoHost}/api/v2/schemas?_index=schema_base&limit=7`)
      .then(r => {
        this.search.all = r.data.map(x => {
          return {
            namespace: x.namespace,
            DRI: x.DRI,
            schemaName: x.schema.name
          }
        })
      })
  },
  methods: {
    fetchOcaSchemas: async function (input, update) {
      const r = await axios.get(`${this.ocaRepoHost}/api/v2/schemas?suggest=${input}`);

      update(() => {
        this.search.matching = r.data.map(x => {
          return {
            namespace: x.namespace,
            DRI: x.DRI,
            schemaName: x.schema.name
          }
        })
      })
    },
    getOcaSchema: async function (schema) {
      let namespace, dri, schemaName, ocaForm = null;

      if (schema) {
        this.ocaFormAlternatives = []
        const result = await axios.get(`${this.ocaRepoHost}/api/v2/schemas?_index=branch&schema_base=${schema.DRI}`)

        const branchesBase = result.data.filter(e => e.namespace == schema.namespace)
        const branchBase = branchesBase[0]

        if (branchBase) {
          const branchResponse = await axios.get(`${this.ocaRepoHost}/api/v2/schemas/${branchBase.namespace}/${branchBase.DRI}`)
          const branch = branchResponse.data
          const langBranches = this.splitBranchPerLang(branch)

          namespace = branchBase.namespace;
          dri = branchBase.DRI;
          schemaName = schema.schemaName;

          try {
            this.ocaFormAlternatives = await Promise.all(
              langBranches.map(async langBranch => ({
                language: langBranch.lang,
                form: (await renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays])).form
               }))
            )

            ocaForm = this.ocaFormAlternatives[0].form
          } catch (e) {
            this.$noty.error("ERROR! Form data are corrupted.", {
              timeout: 1000
            })
          }
        }
      }

      this.$emit('schemaSelected', {
        namespace,
        DRI: dri,
        schemaName,
      });

      this.ocaForm = ocaForm;
      this.$emit('formRendered', {
        form: ocaForm, formAlternatives: this.ocaFormAlternatives
      })
    },
    splitBranchPerLang: function (branch) {
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
              if (!o.language) { return true }
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
      } catch (e) {
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
  }
}
</script>
