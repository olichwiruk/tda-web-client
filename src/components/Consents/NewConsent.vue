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
        <el-button :disabled="!dataFilled" type="primary"
          @click="openCreateConsentForm">Create</el-button>
      </div>
    </div>

    <preview-component confirmLabel="Create" :confirmProcessing="consentData.sending" ref="ConsentPreviewComponent" :form="consent.form" :alternatives="consent.form_alternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios'
import OcaSchemaSearch from './NewConsent/OcaSchemaSearch'

import Consent from '@/storage/models/Consent'
import InstanceConsentsStorage from '@/storage/InstanceConsentsStorage'
const instanceConsentsStorage = new InstanceConsentsStorage()

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
    dataFilled: function() {
      return this.consent.oca_schema_dri && this.consent.form && this.consent.label.length > 0
    },
    instanceConsents: function() {
      return instanceConsentsStorage.findByInstance(
        this.instanceUuid, this.instanceAgent
      )
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
      this.consentData.sending = true

      axios.post(`${this.acapyApiUrl}/pds/save`, {
        payload: dataStr
      }).then(r => {
        this.consentData.dri = r.data.payload_id
        this.consentData.sending = false
        const consent = new Consent(
          this.consent.label, this.consent.oca_schema_namespace,
          this.consent.oca_schema_dri, this.consentData.dri
        )
        const result = this.instanceConsents.addConsent(consent)
        if (result.success) {
          instanceConsentsStorage.add(this.instanceConsents)
        } else {
          this.$noty.error(`Error: ${result.errors.join(', ')}`, {
            timeout: 1000
          })
        }

        this.consent.label = ''
        this.$emit('consents-refresh')
        this.$refs.ConsentPreviewComponent.closeModal();
      }).catch(e => {
        console.log(e)
        this.$noty.error(`PDS error`, { timeout: 1000 })
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
