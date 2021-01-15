<template>
  <q-card style="min-width: 50vw">
    <q-card-section>
      <div class="text-h6">{{title}}</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="row">
        <div class="col-12 col-md-7">
          <oca-schema-search
            label="Service:"
            :ocaRepoHost="ocaRepoHost"
            @serviceSchemaSelected="serviceSchemaSelected"
          />
        </div>

        <div class="col-12 col-md-1" />

        <div class="col-12 col-md-4">
          <consent-select
            label="Consent:"
            @consentSelected="consentSelected"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        flat
        label="Cancel"
        color="primary"
        v-close-popup
      />
      <q-btn
        :disable="!dataFilled"
        flat
        label="Submit"
        color="primary"
        v-close-popup
        @click="submit"
      />
    </q-card-actions>

  </q-card>
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
      return this.$session.get('ocaRepoUrl')
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
      this.consent.oca_schema_namespace = consent.oca_schema_namespace
      this.consent.oca_schema_dri = consent.oca_schema_dri
      this.consent.data_dri = consent.oca_data_dri
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
