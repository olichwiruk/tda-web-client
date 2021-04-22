<template>
  <q-card style="min-width: 50vw">
    <q-card-section>
      <div class="text-h6">{{title}}</div>
    </q-card-section>

    <q-card-section>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-8">
          <oca-schema-search
            label="Service:"
            :ocaRepoHost="ocaRepoHost"
            @schemaSelected="serviceSchemaSelected"
          />
          <oca-schema-search
            label="Certificate:"
            :ocaRepoHost="ocaRepoHost"
            @schemaSelected="certificateSchemaSelected"
          />
        </div>

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
        @click="cancel"
      />
      <q-btn
        :disable="!dataFilled"
        flat
        label="Submit"
        color="primary"
        @click="submit"
      />
    </q-card-actions>

  </q-card>
</template>

<script>
import axios from 'axios'
import OcaSchemaSearch from './NewService/OcaSchemaSearch'
import ConsentSelect from './NewService/ConsentSelect'
import Storage from '../../../storage'

export default {
  name: 'new-service',
  props: ['title'],
  components: {
    OcaSchemaSearch,
    ConsentSelect
  },
  data () {
    return {
      serviceLabel: null,
      service: {
        oca_schema_dri: null,
        oca_schema_namespace: null
      },
      certificateLabel: null,
      certificate: {
        oca_schema_dri: null,
        oca_schema_namespace: null
      },
      consent: {
        id: null
      }
    }
  },
  computed: {
    ocaRepoHost: function() {
      return Storage.get(Storage.Record.OcaRepoUrl)
    },
    acapyApiUrl: function() {
      return Storage.get(Storage.Record.AdminApiUrl)
    },
    dataFilled: function() {
      return this.consent.id != null &&
        this.service.oca_schema_dri != null
    }
  },
  methods: {
    serviceSchemaSelected({ namespace, DRI, schemaName }) {
      this.serviceLabel = schemaName
      this.service.oca_schema_dri = DRI
      this.service.oca_schema_namespace = namespace
    },
    certificateSchemaSelected({ namespace, DRI, schemaName }) {
      this.certificateLabel = schemaName
      this.certificate.oca_schema_dri = DRI
      this.certificate.oca_schema_namespace = namespace
    },
    consentSelected(consent) {
      this.consent.id = consent.consent_id
    },
    resetServiceData() {
      this.serviceLabel = null
      this.service = {
        oca_schema_dri: null,
        oca_schema_namespace: null
      }
      this.certificateLabel = null
      this.certificate = {
        oca_schema_dri: null,
        oca_schema_namespace: null
      }
      this.consent = {
        id: null
      }
    },
    submit() {
      let body = {
        label: this.certificateLabel,
        consent_id: this.consent.id,
        service_schema: this.service,
        certificate_schema: this.certificate
      }
      if (!this.certificate.oca_schema_dri) {
        body['label'] = this.serviceLabel
        delete body['certificate_schema']
      }
      axios.post(`${this.acapyApiUrl}/verifiable-services/add`, body)
        .then(r => {
        if (r.status === 200) {
          this.$notify.success('Service created!')

          this.$emit('services-refresh')
          this.resetServiceData();
        }
      }).catch(e => {
        console.error(e)
        this.$notify.error('Error occuerrd')
      })
    },
    cancel() {
      this.$emit('services-refresh');
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
