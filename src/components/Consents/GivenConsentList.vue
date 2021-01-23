<template>
  <q-list v-if="consents.length > 0">
    <q-item-label
      header
      v-if="title"
    >{{title}}</q-item-label>

    <q-item
      v-for="(consent, index) in consents"
      :name="consent.label + index"
      :key="index"
    >
      <q-item-section>{{ consent.label }}</q-item-section>
      <q-item-section side>
        <q-btn
          flat
          @click="preview(consent)"
        >
          Preview
        </q-btn>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script>
import axios from 'axios';

import VueJsonPretty from 'vue-json-pretty';
import { renderForm } from '@/oca.js-vue'

export default {
  name: 'given-consent-list',
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
      const consentAnswers = consent.data
      const consentSchemaDri = consent.ocaSchemaDri
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v3/schemas/${consentSchemaDri}`
      )).data

      const consentLangBranches = this.splitBranchPerLang(consentBranch)
      let consentForm
      let consentFormAlternatives = []
      try {
        consentFormAlternatives = await Promise.all(
          consentLangBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              consentSchemaDri
            )).form
          })
        ));
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
      console.log(consent)
      const serviceBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v3/schemas/${consent.service_schema.oca_schema_dri}`
      )).data

      const serviceLangBranches = this.splitBranchPerLang(serviceBranch)
      let serviceForm
      let serviceFormAlternatives = []
      try {
        serviceFormAlternatives = await Promise.all(
          serviceLangBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              consent.service_schema.oca_schema_dri
            )).form
          })
        ));
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
        service: await this.renderServiceForm(consent),
        consent: await this.renderConsentForm(consent)
      })
    }
  },
}
</script>
