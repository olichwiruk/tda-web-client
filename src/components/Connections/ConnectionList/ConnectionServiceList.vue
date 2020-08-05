<template>
  <div v-show="services.length > 0">
    {{ title }}
    <ul class="list">
      <li class="list-el" v-for="service in services">
        {{ service.label }}
        <div>
          <el-button size="medium"
            @click="preview(service)">Preview</el-button>
          <el-button size="medium" type="primary"
            @click="apply(service)">Apply</el-button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

import { renderForm } from 'odca-form'

export default {
  name: 'connection-service-list',
  props: ['title', 'connection'],
  components: {},
  data () {
    return {
      services: []
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    ocaRepoUrl: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_OCA_REPO}.${config.env.VUE_APP_HOST}`
    },
    servicesSorted: function() {
      return this.services.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }
  },
  methods: {
    fetchServices() {
      const connId = this.connection.connection_id
      axios.get(`${this.acapyApiUrl}/service-discovery/request-list/${connId}`)
        .then(result => {
          if (result.status === 200) {
            axios.get(`${this.acapyApiUrl}/service-discovery/get-list/${connId}`)
              .then(r => {
                this.services = r.data.services || []
              })
          }
        })
    },
    async renderServiceForm(service) {
      const consentAnswers = (await axios.get(service.consent_schema.data_url)).data
      const consentBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${service.consent_schema.oca_schema_namespace}/${service.consent_schema.oca_schema_dri}`
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
        `${this.ocaRepoUrl}/api/v2/schemas/${service.service_schema.oca_schema_namespace}/${service.service_schema.oca_schema_dri}`
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
        id: service.service_id,
        consent: {
          form: consentForm,
          formAlternatives: consentFormAlternatives,
          answers: consentAnswers
        },
        schema: {
          form: serviceForm,
          formAlternatives: serviceFormAlternatives
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
    async preview(service) {
      this.$emit('service-preview', {
        connection_id: this.connection.connection_id,
        service: await this.renderServiceForm(service)
      })
    },
    async apply(service) {
      this.$emit('service-apply', {
        connection_id: this.connection.connection_id,
        service: await this.renderServiceForm(service)
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
</style>
