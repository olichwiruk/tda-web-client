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

    <preview-component confirmLabel="Create" :readonly="false" :confirmProcessing="consentData.sending" ref="ConsentPreviewComponent" :form="consent.form" :alternatives="consent.form_alternatives"></preview-component>
  </div>
</template>

<script>
import adminApi from '@/admin_api.ts'
import OcaSchemaSearch from './NewConsent/OcaSchemaSearch'

import { eventBus as ocaEventBus, EventHandlerConstant,
  PreviewComponent } from 'oca.js-vue'

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
  mixins: [adminApi],
  computed: {
    ocaRepoHost: function() {
      return this.$session.get('ocaRepoUrl')
    },
    localDataVaultUrl: function() {
      return this.$session.get('localDataVaultUrl')
    },
    dataFilled: function() {
      return this.consent.oca_schema_dri && this.consent.form && this.consent.label.length > 0
    },
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
        const schemaDri = this.consent.oca_schema_dri
        this.$_adminApi_getCurrentData({ schemaDris: [schemaDri] })
          .then(r => {
            let input = null
            const schemaFillings = r.data.result[schemaDri]
            if (schemaFillings.length > 0) {
              input = JSON.parse(schemaFillings[0].content)
            }

            this.$refs.ConsentPreviewComponent.openModal(this.consent.form, input);
          })
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    sendConsentData(data) {
      this.consentData.sending = true

      this.$_adminApi_addConsent({
        label: this.consent.label,
        oca_schema_namespace: this.consent.oca_schema_namespace,
        oca_schema_dri: this.consent.oca_schema_dri,
        data: Object.values(data)[0].p
      }).then(r => {
        this.consentData.sending = false
        if (r.data.success) {
          this.$emit('consents-refresh')
          this.consent.label = ''
          this.$refs.ConsentPreviewComponent.closeModal();
        } else {
          this.$noty.error(`Error: ${result.errors.join(', ')}`, {
            timeout: 1000
          })
        }
      }).catch(e => {
        console.log(e)
        this.consentData.sending = false
        this.$noty.error(`Error occurred`, { timeout: 1000 })
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
