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
      :forms="forms" :key="forms.map(f => f.formData._uniqueId).join('-')"
      ref="PreviewApplicationComponent" />
  </el-row>
</template>

<script>
import axios from 'axios';
import { PreviewComponent, MultiPreviewComponent } from 'odca-form'
import NewConsent from './NewConsent'
import ConsentList from './ConsentList'
import InstanceConsentsStorage from '@/storage/InstanceConsentsStorage'
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
    })
  ],
  data() {
    return {
      defined_consent_list: [],
      given_consent_list: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      forms: [
        { class: "col-md-7", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} }
      ],
      alternatives: [],
    }
  },
  computed: {
    instanceUuid: function() {
      return this.$session.get('instanceUuid')
    },
    instanceAgent: function() {
      return this.$session.get('instanceAgent')
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  methods: {
    refreshDefinedConsents() {
      const instanceConsentsStorage = new InstanceConsentsStorage()
      const instanceConsents = instanceConsentsStorage.findByInstance(
        this.instanceUuid, this.instanceAgent
      )
      this.defined_consent_list = instanceConsents ? instanceConsents.list : []
    },
    async refreshGivenConsents() {
      await axios.get(`${this.acapyApiUrl}/issue-credential/records`, {
        state: 'credential_acked'
      }).then(r => {
        if (r.status === 200) {
          const givenCredentials = r.data.results.filter(el => {
            return el.credential_offer_dict.credential_preview.attributes.some(attr => {
              return attr.name == 'oca_schema_namespace' && attr.value == 'consent'
            })
          })
          this.given_consent_list = givenCredentials.map(el => {
            const serviceConsentMatchId = el.credential_offer_dict.credential_preview.attributes.find(attr => attr.name == 'service_consent_match_id').value

            return {
              label: '',
              ocaSchemaNamespace: el.credential_offer_dict.credential_preview.attributes.find(attr => attr.name == 'oca_schema_namespace').value,
              ocaSchemaDri: el.credential_offer_dict.credential_preview.attributes.find(attr => attr.name == 'oca_schema_dri').value,
              dataDri: el.credential_offer_dict.credential_preview.attributes.find(attr => attr.name == 'data_dri').value.split('/').reverse()[0],
              serviceConsentMatchId: serviceConsentMatchId
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
        consent: event.consent
      }
      this.currentApplication = application
      this.previewLabel = 'Application'
      this.collectForms(application)
      this.$refs.PreviewApplicationComponent.openModal()
    },
    collectForms(application, options=[]) {
      Object.assign(this.forms[0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives
        }, options[0])
      if(application.schema.answers) {
        Object.assign(this.forms[0], { input: application.schema.answers })
      }
      Object.assign(this.forms[1],
        {
          label: application.consent.form.label,
          formData: application.consent.form,
          alternatives: application.consent.formAlternatives,
          input: application.consent.answers
        }, options[1])
    },
  },
  mounted() {
    this.refreshDefinedConsents()
    this.refreshGivenConsents()
  }
}
</script>
