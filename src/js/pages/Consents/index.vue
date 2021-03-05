<template>
  <q-page class="q-pa-xl">
  <div>
    <q-dialog v-model="isNewConsentVisible">
      <new-consent
        title="Create new consent"
        @consents-refresh="refreshConsents"
      />
    </q-dialog>

    <q-card style="max-width: 500px;">
      <q-banner inline-actions>
        <span class="text-h5">Consents</span>
        <template v-slot:action>
          <!-- <custom-spinner :show="isRefreshing" /> -->

          <q-btn
            flat
            dense
            icon="add"
            @click="isNewConsentVisible = true"
          ></q-btn>

          <q-btn
            flat
            dense
            icon="refresh"
            @click="refreshConsents"
          ></q-btn>
        </template>
      </q-banner>

      <q-list v-if="allConsents.length == 0">
        <q-item>No consents were created or given so far.</q-item>
      </q-list>
      <template v-else>
        <defined-consent-list
          title="Defined by me"
          :consents="defined_consent_list"
          @consents-refresh="refreshDefinedConsents"
          @consent-preview="previewConsent($event)"
        />
        <given-consent-list
          title="Given by me"
          :consents="given_consent_list"
          @consents-refresh="refreshGivenConsents"
          @consent-preview="previewApplication($event)"
        />
      </template>
    </q-card>

    <preview-component
      :readonly="true"
      ref="PreviewConsentComponent"
      :form="{}"
      :alternatives="alternatives"
    ></preview-component>

    <multi-preview-component
      :label="previewLabel"
      :readonly="readonlyPreview"
      :forms="forms"
      :key="forms.flat().map(f => f.formData._uniqueId).join('-')"
      ref="PreviewApplicationComponent"
    />
  </div>
  </q-page>
</template>

<script>
import axios from 'axios';
import adminApi from '../../admin_api'
import { PreviewComponent, MultiPreviewComponent } from '../../oca.js-vue'
import GivenConsentList from './GivenConsentList'
/*
import CustomSpinner from '../../components/Spinner/CustomSpinner.vue';
*/
import NewConsent from './NewConsent'
import DefinedConsentList from './DefinedConsentList'
import Storage from '../../../storage'
import { mapGetters } from 'vuex'

export default {
  name: 'consents',
  components: {
    DefinedConsentList,
    NewConsent,
    PreviewComponent,
    GivenConsentList,
    MultiPreviewComponent,
  /*
    CustomSpinner,
    */
  },
  mixins: [adminApi],
  data() {
    return {
      defined_consent_list: [],
      given_consent_list: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      forms: [
        [{ class: "col-md-7", readonly: true, formData: {} }],
        [{ class: "col-md-5", readonly: true, formData: {} }]
      ],
      alternatives: [],
      isRefreshing: false,
      isNewConsentVisible: false,
    }
  },
  computed: {
    ...mapGetters('agentCommunication', ['activeConnections']),
    allConsents() {
      return [
        ...this.defined_consent_list,
        ...this.given_consent_list,
      ]
    },
    acapyApiUrl() {
      return Storage.get(Storage.Record.AdminApiUrl)
    }
  },
  methods: {
    async refreshConsents() {
      this.isNewConsentVisible = false
      this.isRefreshing = true;

      await Promise.all([
        this.refreshDefinedConsents(),
        this.refreshGivenConsents()
      ]);

      this.isRefreshing = false;
    },
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
            .map(el => el.credential)
          this.given_consent_list = givenCredentials.map(el => {
            const cred = el.credentialSubject
            return {
              label: '',
              ocaSchemaNamespace: cred.oca_schema_namespace,
              ocaSchemaDri: cred.oca_schema_dri,
              dataDri: cred.data_dri,
              serviceConsentMatchId: cred.service_consent_match_id
            }
          })
        }
      }).catch(e => {
        console.log(e)
        this.$notify.error('Error occurred')
      })

      this.given_consent_list.forEach(async consent => {
        await axios.post(
          `${this.acapyApiUrl}/verifiable-services/get-issue`, {
          "author": "self",
          "service_consent_match_id": consent.serviceConsentMatchId
        }
        ).then(r => {
          const service = r.data.result[0]
          consent.label = service.label
          consent.data = service.consent_schema.oca_data
          consent.service_schema = service.service_schema
          consent.service_payload = service.service_user_data
          consent.created_at = service.created_at
          consent.connection = this.activeConnections.find(conn =>
            conn.connection_id == service.connection_id
          )
        })
      })
    },
    previewConsent(event) {
      console.log(event)
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
    collectForms(application, options=[[], []]) {
      Object.assign(this.forms[0][0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives,
          input: null
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
    },
  },
  mounted() {
    this.refreshConsents()
  }
}
</script>
