<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>

      <el-button type="primary" icon="el-icon-refresh"
        @click="$emit('consents-refresh')"></el-button>
    </nav>

    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="(consent, index) in consents"
          :name="consent.label + index"
          :key="index">
          <template v-slot:title>{{ consent.label }} {{ consent.created_at ? '| ' + consent.created_at : '' }} {{ consent.connection ? '| ' + consent.connection.their_label : '' }}</template>
          <el-row>
            <vue-json-pretty :deep=0 :data="consent" />
            <el-button size="medium"
              @click="preview(consent)">Preview</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
  </div>
</template>

<script>
import axios from 'axios';

import VueJsonPretty from 'vue-json-pretty';
import { renderForm } from 'oca.js-vue'

export default {
  name: 'consent-list',
  props: [
    'title',
    'consents'
  ],
  components: {
    VueJsonPretty
  },
  data () {
    return {
      expanded_items:[],
    }
  },
  computed: {
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
  },
  methods: {
    async renderConsentForm(consent) {
      let consentAnswers, consentSchemaNamespace, consentSchemaDri
      if (consent.oca_data) {
        consentAnswers = consent.oca_data
        consentSchemaNamespace = consent.oca_schema_namespace
        consentSchemaDri = consent.oca_schema_dri
      } else {
        consentAnswers = JSON.parse(consent.data)
        consentSchemaNamespace = consent.ocaSchemaNamespace
        consentSchemaDri = consent.ocaSchemaDri
      }
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${consentSchemaNamespace}/${consentSchemaDri}`
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

      return {
        form: consentForm,
        formAlternatives: consentFormAlternatives,
        answers: consentAnswers
      }
    },
    async renderServiceForm(consent) {
      if (!consent.service_schema) { return {} }
      const serviceBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${consent.service_schema.oca_schema_namespace}/${consent.service_schema.oca_schema_dri}`
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
        form: serviceForm,
        formAlternatives: serviceFormAlternatives,
        answers: consent.service_payload
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
    async preview(consent) {
      this.$emit('consent-preview', {
        consent: await this.renderConsentForm(consent),
        service: await this.renderServiceForm(consent)
      })
    }
  },
}
</script>
