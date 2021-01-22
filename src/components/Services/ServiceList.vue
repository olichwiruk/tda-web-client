<template>
  <q-list v-if="showServiceList">
    <q-item-label
      header
      class="text-h6"
      v-if="title"
    >{{title}}</q-item-label>

    <template v-for="(group, groupIndex) in services">

      <q-separator :key="'separator' + group.label + groupIndex" />
      <q-item-label
        header
        :key="'service' + group.label + groupIndex"
      >{{group.label}}</q-item-label>

      <q-item
        v-for="(service, index) in group.services"
        :key="service.label + index"
        clickable
      >
        <q-item-section @click="apply(service, group.connection_id)">
          <div class="row items-center">{{service.label}}
            <q-icon
              v-if="showUsagePolicy"
              class="q-ml-sm"
              name="shield"
              size="xs"
              :color="getPolicyValidation(service).color"
            >
              <q-tooltip>{{getPolicyValidation(service).text}}</q-tooltip>
            </q-icon>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            @click="preview(service, group.connection_id)"
          >Preview</q-btn>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script>
import axios from 'axios';

import VueJsonPretty from 'vue-json-pretty';
import { renderForm } from '@/oca.js-vue';

import {
  toOca as usagePolicyToOca,
  serializeInput as serializeUsagePolicyInput
} from '@/usage_policy_helper';

export default {
  name: 'service-list',
  props: {
    title: String,
    services: Array,
    showUsagePolicy: {
      default: true,
      type: Boolean,
    },
  },
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
    showServiceList: function() {
      return this.services.filter(group => group.services.length > 0).length > 0;
    }
  },
  methods: {
    async renderServiceForm(service) {
      const consentAnswers = service.consent_schema.oca_data
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${service.consent_schema.oca_schema_namespace}/${service.consent_schema.oca_schema_dri}`
      )).data

      const consentLangBranches = this.splitBranchPerLang(consentBranch)
      let consentForm
      let consentFormAlternatives = []
      try {
        consentFormAlternatives = await Promise.all(
          consentLangBranches.map(async langBranch => ( {
            language: langBranch.lang,
            form: (await renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays], service.consent_schema.oca_schema_dri)).form
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
        `${this.ocaRepoUrl}/api/v2/schemas/${service.service_schema.oca_schema_namespace}/${service.service_schema.oca_schema_dri}`
      )).data

      const serviceLangBranches = this.splitBranchPerLang(serviceBranch)
      let serviceForm
      let serviceFormAlternatives = []
      try {
        serviceFormAlternatives = await Promise.all(
          serviceLangBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays], service.service_schema.oca_schema_dri)).form
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
        'ttl': service.consent_schema.usage_policy
      })).data
      const form = (await renderForm(usagePolicyToOca(usagePolicyData))).form
      const usagePolicy = {
        form: form,
        formAlternatives: [{
          language: form.translations[0].language,
          form: form
        }],
        answers: serializeUsagePolicyInput(usagePolicyData)
      }

      return {
        id: service.service_id,
        consent: {
          form: consentForm,
          formAlternatives: consentFormAlternatives,
          answers: consentAnswers
        },
        schema: {
          form: serviceForm,
          formAlternatives: serviceFormAlternatives
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
    async preview(service, connection_id) {
      this.$emit('service-preview', {
        connection_id,connection_id,
        service: service,
        serviceForm: await this.renderServiceForm(service)
      })
    },
    async apply(service, connection_id) {
      this.$emit('service-apply', {
        connection_id,
        service: service,
        serviceForm: await this.renderServiceForm(service)
      })
    },
    getPolicyValidation(service) {
      const policy_validation = service.policy_validation

      if (!policy_validation)
        return {
          color: 'grey',
          text: 'Usage policies could not be matched yet.',
        };

      else if (policy_validation.code == 0)
        return {
          color: 'green',
          text: 'Your usage policy matches with that provided by the service. Everything is good.',
        };

      else
        return {
          color: 'red',
          text: 'Your usage policy does not match with that provided by the service. However, you can still proceed with using this service.',
        }
    },
  },
}
</script>
