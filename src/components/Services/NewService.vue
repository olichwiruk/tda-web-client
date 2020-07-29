<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <br>
    <div>
      <div>
        <oca-schema-search label="Service: " :ocaRepoHost="ocaRepoHost"
          @serviceSchemaSelected="serviceSchemaSelected"/>
      </div>

      <br>
      <div>CONSENT SELECT</div>
    </div>

    <div>SUBMIT BUTTON</div>
  </div>
</template>

<script>
import OcaSchemaSearch from './OcaSchemaSearch'

export default {
  name: 'new-service',
  props: [
    'title'
  ],
  components: {
    OcaSchemaSearch
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
  },
  methods: {
    serviceSchemaSelected({ namespace, DRI, schemaName }) {
      this.label = schemaName
      this.service.oca_schema_dri = DRI
      this.service.oca_schema_namespace = namespace
    }
  },
}
</script>
