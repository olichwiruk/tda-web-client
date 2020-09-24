<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <el-input placeholder="Label" v-model="consent.label"
        style="width: 200px;"></el-input>
      <oca-schema-search label="Schema:" :ocaRepoHost="ocaRepoHost"
        @consentSchemaSelected="consentSchemaSelected"
        @consentFormRendered="consentFormRendered"/>
      <div>
        <el-button :disabled="!consentSelected" type="primary"
          @click="openCreateConsentForm">Create</el-button>
      </div>
    </div>

    <preview-component confirmLabel="Create" :confirmProcessing="consentData.sending" ref="ConsentPreviewComponent" :form="consent.form" :alternatives="consent.form_alternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios'
import { add_consent } from '@/storage/persistence'
import OcaSchemaSearch from './NewConsent/OcaSchemaSearch'

import { eventBus as ocaEventBus, EventHandlerConstant,
  PreviewComponent } from 'odca-form'

export default {
  name: 'new-consent',
  props: ['title'],
  components: {
    OcaSchemaSearch,
    PreviewComponent
  },
  data () {
    return {
      consent: {
        label: '',
        oca_schema_dri: null,
        oca_schema_namespace: null,
        form: null,
        form_alternatives: null
      },
      consentData: {
        dri: null,
        sending: false
      }
    }
  },
  computed: {
    ocaRepoHost: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_OCA_REPO}.${config.env.VUE_APP_HOST}`
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    localDataVaultUrl: function() {
      return this.$session.get('localDataVaultUrl')
    },
    instanceUuid: function() {
      return this.$session.get('instanceUuid')
    },
    instanceAgent: function() {
      return this.$session.get('instanceAgent')
    },
    consentSelected: function() {
      return this.consent.oca_schema_dri && this.consent.form
    }
  },
  methods: {
    consentSchemaSelected({ namespace, DRI }) {
      this.consent.oca_schema_dri = DRI
      this.consent.oca_schema_namespace = namespace
    },
    consentFormRendered({ form, formAlternatives }) {
      this.consent.form = form
      this.consent.form_alternatives = formAlternatives
    },
    openCreateConsentForm() {
      try {
        this.$refs.ConsentPreviewComponent.openModal(this.consent.form);
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    sendConsentData(data) {
      const dataStr = JSON.stringify(data, null, 2)
      const blob = new Blob([dataStr], {type: 'application/json'})
      this.consentData.sending = true

      const formData = new FormData()
      formData.append("file", blob, `consent.json`)
      axios.post(`${this.localDataVaultUrl}/api/v1/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => {
        console.log(r.data)
        this.consentData.dri = r.data
        this.consentData.sending = false
        add_consent({
          instanceUuid: this.instanceUuid,
          instanceAgent: this.instanceAgent
        }, {
          label: this.consent.label,
          ocaSchemaNamespace: this.consent.oca_schema_namespace,
          ocaSchemaDri: this.consent.oca_schema_dri,
          dataDri: this.consentData.dri
        })

        this.consent.label = ''
        this.$emit('consents-refresh')
        this.$refs.ConsentPreviewComponent.closeModal();
      })
    }
  },
  mounted() {
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.sendConsentData)
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
