<template>
  <div v-if="list.length">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>

      <el-button type="primary" icon="el-icon-refresh"
        @click="$emit('applications-refresh')"></el-button>
    </nav>

    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="(application, index) in list"
          :name="application.label + index"
          :key="index">
          <template v-slot:title>
            {{ application.label }} | {{ label }} {{ application.connection ? application.connection.their_label : '' }}
            <div v-if="application.author == 'other'" class="valid-policy-dot" :class="[ policyColor(application) ]" />
          </template>
          <el-row>
            <vue-json-pretty :deep=0 :data="application" />
            <el-button size="medium" :disabled="!application.payload"
              @click="preview(application)">Preview</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
  </div>
</template>

<script>
import axios from 'axios';

import VueJsonPretty from 'vue-json-pretty';
import { renderForm } from 'odca-form'

export default {
  name: 'application-list',
  props: { title: String, list: Array, label: String },
  components: {
    VueJsonPretty
  },
  data () {
    return {
      expanded_items:[],
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
  },
  methods: {
    policyColor(application) {
      if (!application.usage_policies_match) { return }
      const usage_policy = JSON.parse(application.usage_policies_match)
      if (usage_policy.code != 0) { return 'red' }
      return 'green'
    },
    async renderApplicationForm(application) {
      let consentAnswers
      if(application.consent_schema.data) {
        consentAnswers = JSON.parse(application.consent_schema.data)
      } else {
        consentAnswers = JSON.parse((await axios.get(`${this.acapyApiUrl}/pds/${application.consent_schema.data_dri}`)).data.payload)
      }
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${application.consent_schema.oca_schema_namespace}/${application.consent_schema.oca_schema_dri}`
      )).data

      const consentLangBranches = this.splitBranchPerLang(consentBranch)
      let consentForm
      const consentFormAlternatives = []
      try {
        consentLangBranches.forEach(langBranch => {
          consentFormAlternatives.push({
            language: langBranch.lang,
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays]).form
          })
        })
        consentForm = consentFormAlternatives[0].form
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Consent form data are corrupted.", {
          timeout: 1000
        })
      }

      const serviceBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${application.service_schema.oca_schema_namespace}/${application.service_schema.oca_schema_dri}`
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

      return {
        service_id: application.service_id,
        consent: {
          form: consentForm,
          formAlternatives: consentFormAlternatives,
          answers: consentAnswers
        },
        schema: {
          form: serviceForm,
          formAlternatives: serviceFormAlternatives,
          answers: application.payload
        }
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
    async preview(application) {
      this.$emit('application-preview',
        Object.assign(
          await this.renderApplicationForm(application),
          { connection_id: application.connection_id,
            issue_id: application.issue_id }
        )
      )
    }
  },
}
</script>

<style scoped>
.valid-policy-dot {
  height: 15px;
  width: 15px;
  background-color: #bbbbbb;
  border-radius: 50%;
  margin-left: 10px;
}

.valid-policy-dot.green {
  background-color: green;
}

.valid-policy-dot.red {
  background-color: red;
}
</style>
