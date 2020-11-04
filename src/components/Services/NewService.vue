<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <oca-schema-search label="Service:" :ocaRepoHost="ocaRepoHost"
        @serviceSchemaSelected="serviceSchemaSelected"/>

      <consent-select label="Consent:" @consentSelected="consentSelected"/>

      <div>
        <el-button :disabled="!dataFilled" type="primary"
          @click="submit">Submit</el-button>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import OcaSchemaSearch from './NewService/OcaSchemaSearch'
import ConsentSelect from './NewService/ConsentSelect'

export default {
  name: 'new-service',
  props: ['title'],
  components: {
    OcaSchemaSearch,
    ConsentSelect
  },
  data () {
    return {
      label: null,
      service: {
        oca_schema_dri: null,
        oca_schema_namespace: null
      },
      consent: {
        oca_schema_dri: null,
        oca_schema_namespace: null,
        data_dri: null
      }
    }
  },
  computed: {
    ocaRepoHost: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_OCA_REPO_URL}`
    },
    localDataVaultUrl: function() {
      return this.$session.get('localDataVaultUrl')
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    dataFilled: function() {
      return this.label != null &&
        this.service.oca_schema_dri != null &&
        this.consent.data_dri != null
    }
  },
  methods: {
    serviceSchemaSelected({ namespace, DRI, schemaName }) {
      this.label = schemaName
      this.service.oca_schema_dri = DRI
      this.service.oca_schema_namespace = namespace
    },
    consentSelected(consent) {
      this.consent.oca_schema_dri = consent.ocaSchemaDri
      this.consent.oca_schema_namespace = consent.ocaSchemaNamespace
      this.consent.data_dri = String(consent.dataDri)
    },
    resetServiceData() {
      this.label = null
      this.service = {
        oca_schema_dri: null,
        oca_schema_namespace: null
      }
      this.consent = {
        oca_schema_dri: null,
        oca_schema_namespace: null,
        data_dri: null
      }
    },
    submit() {
      axios.post(`${this.acapyApiUrl}/verifiable-services/add`, {
        label: this.label,
        service_schema: this.service,
        consent_schema: this.consent
      }).then(r => {
        if (r.status === 200) {
          this.$noty.success("Service created!", { timeout: 1000 })
          this.$emit('services-refresh')
          this.resetServiceData()
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occuerrd", { timeout: 1000 })
      })
    }
  },
}
</script>


<style scoped>
.content {
  display: flex;
  justify-content: space-around;
  padding: 20px 0px;
}
</style>
