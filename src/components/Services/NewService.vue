<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <oca-schema-search label="Service:" :ocaRepoHost="ocaRepoHost"
        @serviceSchemaSelected="serviceSchemaSelected"/>

      <consent-select label="Consent:" :dataVaultHost="dataVaultHost"
        @consentSelected="consentSelected"/>
    </div>

    <div>SUBMIT BUTTON</div>
  </div>
</template>

<script>
import OcaSchemaSearch from './OcaSchemaSearch'
import ConsentSelect from './ConsentSelect'

export default {
  name: 'new-service',
  props: [
    'title'
  ],
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
        data_url: null
      }
    }
  },
  computed: {
    ocaRepoHost: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_OCA_REPO}.${config.env.VUE_APP_HOST}`
    },
    dataVaultHost: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_DATA_VAULT}.${config.env.VUE_APP_HOST}`
    },
    consentSchema: function() {
      return {
        namespace: "consent",
        DRI: "fArVHJTQSKHu2CeXJocQmH3HHxzZXsuQD7kzyHJhQ49s"
      }
    }
  },
  methods: {
    serviceSchemaSelected({ namespace, DRI, schemaName }) {
      this.label = schemaName
      this.service.oca_schema_dri = DRI
      this.service.oca_schema_namespace = namespace
    },
    consentSelected(DRI) {
      this.consent.oca_schema_dri = this.consentSchema.DRI
      this.consent.oca_schema_namespace = this.consentSchema.namespace
      this.consent.data_url = `${this.dataVaultHost}/api/v1/files/${DRI}`
    }
  },
}
</script>

<style scoped>
.content {
  display: flex;
  padding: 20px 30px;
}
</style>
