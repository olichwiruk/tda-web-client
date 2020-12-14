<template>
  <div v-show="services.length > 0">
    {{ title }}
    <ul class="list">
      <li class="list-el" v-for="service in services">
        {{ service.label }}
        <div class="right-container">
          <div class="valid-policy-dot" :class="[ isPolicyValid(service) ? 'green' : 'red' ]" />
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
    ...mapState('WsMessages', ['messages']),
    serviceListMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/request-service-list/'
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
          this.services = JSON.parse(message.content.services)
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
      const consentAnswers = JSON.parse(service.consent_schema.data)
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
    isPolicyValid(service) {
      const policy_validation = JSON.parse(service.policy_validation)
      if (policy_validation.code == 0) {
        return true
      }
      return false
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
  margin-right: 10px;
}

.valid-policy-dot.green {
  background-color: green;
}

.valid-policy-dot.red {
  background-color: red;
}

</style>
