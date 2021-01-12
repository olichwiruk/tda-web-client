<template>
  <el-row>
    <new-consent title="Create new consent"
      @consents-refresh="refreshDefinedConsents" />
    <consent-list title="Defined consents" :consents="defined_consent_list"
      @consents-refresh="refreshDefinedConsents"
      @consent-preview="previewConsent($event)" />
    <consent-list title="Given consents" :consents="given_consent_list"
      @consents-refresh="refreshGivenConsents"
      @consent-preview="previewApplication($event)" />

    <preview-component :readonly="true" ref="PreviewConsentComponent" :form="{}" :alternatives="alternatives"></preview-component>

    <multi-preview-component :label="previewLabel" :readonly="readonlyPreview"
      :forms="forms" :key="forms.flat().map(f => f.formData._uniqueId).join('-')"
      ref="PreviewApplicationComponent" />
  </el-row>
</template>

<script>
import axios from 'axios';
import adminApi from '@/admin_api.ts'
import { PreviewComponent, MultiPreviewComponent } from 'oca.js-vue'
import NewConsent from './NewConsent'
import ConsentList from './ConsentList'
import share from '@/share.ts';

export const metadata = {
  menu: {
    label: 'Consents',
    icon: 'el-icon-goods',
    group: 'Agent to Agent',
    priority: 120,
    required_protocols: []
  }
};

export default {
  name: 'consents',
  components: {
    NewConsent,
    ConsentList,
    PreviewComponent,
    MultiPreviewComponent
  },
  mixins: [
    share({
      use: ['connections'],
    }),
    adminApi
  ],
  data() {
    return {
      defined_consent_list: [],
      given_consent_list: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      forms: [
        [ { class: "col-md-7", readonly: true, formData: {} } ],
        [ { class: "col-md-5", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} } ]
      ],
      alternatives: [],
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  methods: {
    async refreshDefinedConsents() {
      await this.$_adminApi_getConsents()
        .then(r => {
          if (r.status === 200) {
            this.defined_consent_list = r.data.result
          }
        })
    },
    async refreshGivenConsents() {
      await this.$_adminApi_getGivenConsents().then(r => {
        if (r.status === 200) {
          const givenCredentials = r.data.result
            .map(el => JSON.parse(el.credential))
          this.given_consent_list = givenCredentials.map(el => {
            const cred = el.credentialSubject
            return {
              label: '',
              ocaSchemaNamespace: cred.oca_schema_namespace,
              ocaSchemaDri: cred.oca_schema_dri,
              dataDri: cred.oca_data_dri,
              serviceConsentMatchId: cred.service_consent_match_id
            }
          })
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })
      })

      this.given_consent_list.forEach(async consent => {
        await axios.post(
          `${this.acapyApiUrl}/verifiable-services/get-issue-self`, {
            "service_consent_match_id": consent.serviceConsentMatchId
          }
        ).then(r => {
          const service = r.data[0]
          consent.label = service.label
          consent.data = JSON.parse(service.consent_schema).data
          consent.service_schema = JSON.parse(service.service_schema)
          consent.service_payload = JSON.parse(service.payload)
          consent.created_at = service.created_at
          consent.connection = this.connections.find(conn =>
            conn.connection_id == service.connection_id
          )
        })
      })
    },
    previewConsent(event) {
      this.alternatives = event.consent.formAlternatives
      this.$refs.PreviewConsentComponent.openModal(event.consent.form, event.consent.answers)
    },
    previewApplication(event, options={}) {
      const application = {
        schema: event.service,
        consent: event.consent,
        usagePolicy: event.usagePolicy
      }
      this.currentApplication = application
      this.previewLabel = 'Application'
      this.collectForms(application)
      this.$refs.PreviewApplicationComponent.openModal()
    },
    collectForms(application, options=[[], []]) {
      Object.assign(this.forms[0][0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives
        }, options[0][0])
      if(application.schema.answers) {
        Object.assign(this.forms[0][0], { input: application.schema.answers })
      }
      Object.assign(this.forms[1][0],
        {
          label: application.consent.form.label,
          formData: application.consent.form,
          alternatives: application.consent.formAlternatives,
          input: application.consent.answers
        }, options[1][0])
      Object.assign(this.forms[1][1],
        {
          label: application.usagePolicy.form.label,
          formData: application.usagePolicy.form,
          alternatives: application.usagePolicy.formAlternatives
        }, options[1][1])
    },
  },
  mounted() {
    this.refreshDefinedConsents()
    this.refreshGivenConsents()
  }
}
</script>
