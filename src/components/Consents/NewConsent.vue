<template>
  <q-card class="invitation-url-card">
    <q-card-section>
      <div class="text-h6">{{title}}</div>
    </q-card-section>

    <q-card-section>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input
            label="Name"
            outlined
            v-model="consent.label"
          />
        </div>

        <div class="col-12 col-md-8">
          <oca-schema-search
            label="Schema"
            :ocaRepoHost="ocaRepoHost"
            @schemaSelected="consentSchemaSelected"
            @formRendered="consentFormRendered"
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
        @click="openCreateConsentForm"
      />
    </q-card-actions>

    <preview-component
      confirmLabel="Create"
      :confirmProcessing="consentData.sending"
      ref="ConsentPreviewComponent"
      :form="consent.form"
      :alternatives="consent.form_alternatives"
    ></preview-component>
  </q-card>
</template>

<script>
import adminApi from '@/admin_api.ts'
import OcaSchemaSearch from '../Services/NewService/OcaSchemaSearch.vue'

import {
  eventBus as ocaEventBus,
  EventHandlerConstant,
  PreviewComponent
} from '@/oca.js-vue'

export default {
  name: 'new-consent',
  props: ['title'],
  components: {
    OcaSchemaSearch,
    PreviewComponent
  },
  data() {
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
    ocaRepoHost: function () {
      return this.$session.get('ocaRepoUrl')
    },
    localDataVaultUrl: function () {
      return this.$session.get('localDataVaultUrl')
    },
    dataFilled: function () {
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
              // backend sometimes delivers other schema DRIs than the requested one
              // therefore we have to check again for the correct DRI
              // TODO: this has to be fixed on the backend
              const item = schemaFillings.filter(s => typeof s.content === "object").find(s => s.oca_schema_dri == schemaDri);

              if (item)
                input = item.content
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
        data: data
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
