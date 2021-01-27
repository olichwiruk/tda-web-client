<template>
  <div v-if="list.length">
    <q-list>

      <q-item-label header>{{title}}</q-item-label>
      <q-item
        clickable
        ripple
        v-for="(application, index) in list"
        :key="application.label + index"
        @click="preview(application)"
      >
        <q-item-section avatar>
          <q-avatar
            :color="applicationColor(application)"
            :icon="applicationIcon"
            text-color="white"
          >
            <q-tooltip v-if="type == 'pending'">{{getPolicyValidation(application).text}}</q-tooltip>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ application.connection ? application.connection.their_label : '' }}</q-item-label>
          <q-item-label caption>{{application.label}}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import axios from 'axios';

import VueJsonPretty from 'vue-json-pretty';
import { renderForm } from '@/oca.js-vue';
import {
  toOca as usagePolicyToOca,
  serializeInput as  serializeUsagePolicyInput
} from '@/usage_policy_helper';


export default {
  name: 'application-list',
  props: { title: String, list: Array, label: String, type: String },
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
    applicationIcon: function() {
      if (this.type === 'pending')
        return 'shield';

      return 'done';
    }
  },
  methods: {
    async renderApplicationForm(application) {
      let consentAnswers
      if(application.consent_schema.oca_data) {
        consentAnswers = application.consent_schema.oca_data
      } else {
        consentAnswers = JSON.parse((await axios.get(`${this.acapyApiUrl}/pds/${application.consent_schema.oca_data_dri}`)).data.payload)
      }
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${application.consent_schema.oca_schema_namespace}/${application.consent_schema.oca_schema_dri}`
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
              application.consent_schema.oca_schema_dri
            )).form
          }))
        )
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
      let serviceFormAlternatives = []
      try {
        serviceFormAlternatives = await Promise.all(
          serviceLangBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm(
              [langBranch.branch.schema_base, ...langBranch.branch.overlays],
              application.service_schema.oca_schema_dri
            )).form
          }))
        )
        serviceForm = serviceFormAlternatives[0].form
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Service form data are corrupted.", {
          timeout: 1000
        })
      }

      const usagePolicyData = (await axios.post('https://governance.ownyourdata.eu/api/usage-policy/parse', {
        'ttl': application.consent_schema.usage_policy
      })).data
      const form = (await renderForm(usagePolicyToOca(usagePolicyData))).form
      const usagePolicy ={
        form: form,
        formAlternatives: [{
          language: form.translations[0].language,
          form: form
        }],
        answers: serializeUsagePolicyInput(usagePolicyData)
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
        },
        usagePolicy
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
    applicationColor: function(application) {
      if (this.type === 'pending')
        return this.getPolicyValidation(application).color;

      return 'teal';
    },
    getPolicyValidation(application) {
      const policy_validation_str = application.usage_policies_match

      if (!policy_validation_str)
        return {
          color: 'grey',
          text: 'Usage policies could not be matched yet.',
        };
      else {
        const policy_validation = JSON.parse(policy_validation_str)
        if (policy_validation.code == 0)
          return {
            color: 'teal',
            text: 'Applicant usage policy matches with that provided by the service. Everything is good.',
          };

        else
          return {
            color: 'red',
            text: 'Applicant usage policy does not match with that provided by the service.',
          }
      }
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

<style>
</style>
