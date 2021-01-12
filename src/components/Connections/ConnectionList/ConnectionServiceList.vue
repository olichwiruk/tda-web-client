<template>
  <div v-show="services.length > 0">
    {{ title }}
    <ul class="list">
      <li class="list-el" v-for="service in services" :key="service.service_id">
        {{ service.label }}
        <div class="right-container">
          <div class="valid-policy-dot" :class="[ policyColor(service) ]" />
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

import { mapState, mapActions } from 'vuex'
import { renderForm } from 'oca.js-vue'
import { usagePolicyToOca } from '@/usage_policy_to_oca';

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
    ...mapState('WsMessages', ['messages']),
    serviceListMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/request-service-list/'
      })
    },
    servicePolicyValidationMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/request-service-list/usage-policy/'
      })
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
    servicesSorted: function() {
      return this.services.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }
  },
  watch: {
    serviceListMessages: {
      handler: function() {
        this.serviceListMessages.forEach(message => {
          if (message.content.connection_id != this.connection.connection_id) {
            return
          }
          this.services = message.content.services
          this.delete_message(message.uuid)
        })
      },
      deep: true
    },
    servicePolicyValidationMessages: {
      handler: function() {
        this.servicePolicyValidationMessages.forEach(message => {
          var [service_id, policy_validation] = Object.entries(message.content)[0]
          const serviceIndex = this.services.findIndex(s => s.service_id == service_id)
          if (serviceIndex == -1) { return }
          const service = this.services[serviceIndex]
          service.policy_validation = JSON.parse(policy_validation)
          this.$forceUpdate()
          this.delete_message(message.uuid)
        })
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
    fetchServices() {
      const connId = this.connection.connection_id
      axios.get(`${this.acapyApiUrl}/verifiable-services/request-service-list/${connId}`)
    },
    async renderServiceForm(service) {
      const consentAnswers = service.consent_schema.oca_data
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
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays], service.consent_schema.oca_schema_dri).form
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
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays], service.service_schema.oca_schema_dri).form
          })
        })
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
      const form = renderForm(usagePolicyToOca(usagePolicyData)).form
      const usagePolicy ={
        form: form,
        formAlternatives: [{
          language: form.translations[0].language,
          form: form
        }]
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
    policyColor(service) {
      const policy_validation = service.policy_validation
      if (!policy_validation) { return }
      if (policy_validation.code == 0) {
        return 'green'
      }
      return 'red'
    },
    async preview(service) {
      this.$emit('service-preview', {
        connection_id: this.connection.connection_id,
        service: service,
        serviceForm: await this.renderServiceForm(service)
      })
    },
    async apply(service) {
      this.$emit('service-apply', {
        connection_id: this.connection.connection_id,
        service: service,
        serviceForm: await this.renderServiceForm(service)
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
  margin-left: 5px;
  margin-right: 10px;
  cursor: pointer;
}

.valid-policy-dot.green {
  background-color: green;
}

.valid-policy-dot.red {
  background-color: red;
}

</style>
