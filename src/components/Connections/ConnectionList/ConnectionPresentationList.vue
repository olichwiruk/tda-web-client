<template>
  <div v-if="myPresentations.length > 0">
    {{ title }}
    <ul class="list">
      <li class="list-el" v-for="presentation in myPresentations" :key="presentation.presentation_exchange_id">
        {{ presentationLabel(presentation) }}
        <div class="right-container">
          <el-button size="medium"
            @click="preview(presentation)">Preview</el-button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

import adminApi from '@/admin_api.ts'
import { renderForm } from 'oca.js-vue'

export default {
  name: 'connection-presentation-list',
  props: ['title', 'connection', 'presentations', 'presentationPayloads'],
  components: {},
  data () {
    return {
      presentationForms: {}
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
    myPresentations: function() {
      return this.presentations.filter(p => p.connection_id == this.connection.connection_id)
    },
    servicesSorted: function() {
      return this.services.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }
  },
  watch: {
    myPresentations: {
      handler: function() {
        this.myPresentations.forEach(async presentationEl => {
          if (!this.presentationForms[presentationEl.presentation_exchange_id]) {
            this.presentationForms[presentationEl.presentation_exchange_id] =
              await this.renderPresentationForm(presentationEl)
            this.$forceUpdate()
          }
        })
      }
    }
  },
  mixins: [adminApi],
  methods: {
    presentationLabel(presentation) {
      let label = ''
      if (this.presentationForms[presentation.presentation_exchange_id]) {
        label += this.presentationForms[presentation.presentation_exchange_id].form.label
        label += ' | '
      }
      label += presentation.updated_at
      return label
    },
    async renderPresentationForm(presentation) {
      const credential = Object.values(presentation.presentation.verifiableCredential)[0]
      const serviceBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v3/schemas/${credential.credentialSubject.oca_schema_dri}`
      )).data

      const serviceLangBranches = this.splitBranchPerLang(serviceBranch)
      let serviceForm
      const serviceFormAlternatives = []
      try {
        serviceLangBranches.forEach(langBranch => {
          serviceFormAlternatives.push({
            language: langBranch.lang,
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays]).form
          })
        })
        serviceForm = serviceFormAlternatives[0].form
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Service form data are corrupted.", {
          timeout: 1000
        })
      }

      this.$_adminApi_askForPayload({
        connection_id: presentation.connection_id,
        payload_id: credential.credentialSubject.oca_data_dri
      })

      return {
        form: serviceForm,
        formAlternatives: serviceFormAlternatives
      }
    },
    splitBranchPerLang(branch) {
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
    async preview(presentation) {
      const credential = Object.values(presentation.presentation.verifiableCredential)[0]

      this.$emit('presentation-preview', {
        connection_id: this.connection.connection_id,
        presentation: presentation,
        presentationForm: {
          ...this.presentationForms[presentation.presentation_exchange_id],
          payload: this.presentationPayloads[credential.credentialSubject.oca_data_dri]
        }
      })
    }
  }
}
</script>

<style scoped>
.list {
  padding: 5px 10px;
}
.list-el {
  display: flex;
  justify-content: space-between;
  align-items: center;
  list-style-type: none;
  padding: 5px 10px;
  border-top: 1px solid #ececec;
}
.list-el:last-child {
  border-bottom: 1px solid #ececec;
}
.list-el:hover {
  background-color: #fafafa;
}

.right-container {
  display: flex;
  align-items: center;
}

.valid-policy-dot {
  height: 15px;
  width: 15px;
  background-color: #bbbbbb;
  border-radius: 50%;
  margin-right: 10px;
}

.valid-policy-dot.green {
  background-color: green;
}

.valid-policy-dot.red {
  background-color: red;
}

</style>
