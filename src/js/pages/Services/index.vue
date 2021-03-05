<template>
  <q-page class="q-pa-xl">
  <div>
    <q-dialog
      v-model="isCreateServiceDialogVisible"
      persistent
    >
      <new-service
        title="Offer new service"
        @services-refresh="refreshServices"
      />
    </q-dialog>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-6">
        <q-card>
          <q-banner inline-actions>
            <span class="text-h5">Services</span>
            <template v-slot:action>
              <!-- <custom-spinner :show="isRefreshingService" /> -->

              <q-btn
                flat
                dense
                icon="add"
                @click="isCreateServiceDialogVisible = true"
              ></q-btn>
              <q-btn
                flat
                dense
                icon="refresh"
                @click="refreshServices"
              ></q-btn>
            </template>
          </q-banner>

          <q-list v-if="showServicesEmptyMessage">
            <q-item>No services available at the moment.</q-item>
          </q-list>
          <template v-else>
            <service-list
              :services="myServicesSorted"
              :showUsagePolicy="false"
              @services-refresh="refreshServices"
              @service-preview="previewService($event)"
            />
            <service-list
              ref="otherServices"
              :services="otherServices"
              @services-refresh="refreshServices"
              @service-preview="previewService($event)"
              @service-apply="applyService($event)"
            />
          </template>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-banner inline-actions>
            <span class="text-h5">Applications</span>
            <template v-slot:action>
              <!-- <custom-spinner :show="isRefreshingApplications" /> -->

              <q-btn
                flat
                dense
                icon="refresh"
                @click="refreshApplications"
              ></q-btn>
            </template>
          </q-banner>

          <q-list v-if="showApplicationsEmptyMessage">
            <q-item>No applications to show here.</q-item>
          </q-list>
          <template v-else>
            <application-list
              title="Pending applications:"
              :list="pending_applications"
              type="pending"
              label='From:'
              @applications-refresh="refreshApplications"
              @application-preview="previewApplication($event, { self: false, readonly: true })"
            />
            <application-list
              title="Submitted applications:"
              :list="submitted_applications"
              type="submitted"
              label='To:'
              @applications-refresh="refreshApplications"
              @application-preview="previewApplication($event, { self: true, readonly: true })"
            />
          </template>
        </q-card>
      </div>
    </div>

    <multi-preview-component
      :confirmLabel="confirmLabel" :confirmProcessing="confirmProcessing"
      :rejectLabel="rejectLabel" :rejectProcessing="rejectProcessing"
      :readonly="readonlyPreview" :reviewable="reviewablePreview"
      :forms="forms"
      :key="forms.flat().map(f => f.formData._uniqueId).join('-')"
      ref="PreviewServiceComponent"
    />
  </div>
  </q-page>
</template>

<script>
import axios from 'axios';
import adminApi from '../../admin_api.ts'

import { mapGetters, mapActions } from 'vuex'
import NewService from './NewService.vue';
import ServiceList from './ServiceList.vue';
import ApplicationList from './ApplicationList.vue';
/*
import CustomSpinner from '../../components/Spinner/CustomSpinner.vue';

*/
import { MultiPreviewComponent } from '../../oca.js-vue'

import Storage from '../../../storage'

export default {
  name: 'services',
  components: {
    NewService,
    ServiceList,
    ApplicationList,
  /*
    CustomSpinner,
    */
    MultiPreviewComponent
  },
  data() {
    return {
      myServices: [],
      otherServices: [],
      connections: [],
      previewLabel: '',
      readonlyPreview: true,
      reviewablePreview: false,
      currentApplication: {},
      currentApplicationService: {},
      confirmLabel: "",
      rejectLabel: "",
      confirmProcessing: false,
      rejectProcessing: false,
      forms: [
        [{ class: "col-md-7", readonly: true, formData: {} }],
        [{ class: "col-md-5", readonly: true, formData: {} }]
      ],
      dialogContext: null,
      submitted_applications: [],
      pending_applications: [],
      isCreateServiceDialogVisible: false,
      isRefreshingService: false,
      isRefreshingApplications: false,
    }
  },
  mixins: [adminApi],
  computed: {
    ...mapGetters('wsMessages', [
      'serviceListMessages',
      'servicePolicyValidationMessages',
      'incomingApplicationMessages',
      'applicationStateUpdateMessages'
    ]),
    acapyApiUrl: function () {
      return Storage.get(Storage.Record.AdminApiUrl)
    },
    myServicesSorted: function () {
      if (Array.isArray(this.myServices))
        return this.myServices.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at)
        })

      return [];
    },
    allServices() {
      return [
        ...this.myServices,
        ...this.otherServices,
      ];
    },
    showServicesEmptyMessage() {
      return this.allServices.filter(group => group.services.length > 0) == 0;
    },
    allApplications() {
      return [
        ...this.pending_applications,
        ...this.submitted_applications,
      ];
    },
    showApplicationsEmptyMessage() {
      return this.allApplications.length == 0;
    }
  },
  watch: {
    connections: {
      handler: function () {
        this.refreshApplications();
      },
      deep: true
    },
    serviceListMessages: {
      handler: function () {
        if (this.serviceListMessages.length > 0)
          this.otherServices = [];

        this.serviceListMessages.forEach(message => {
          const { connection_id, services } = message.content;
          const conn = this.connections.find(c => c.connection_id === connection_id);

          this.otherServices.push({
            connection_id,
            label: conn ? conn.their_label : connection_id,
            services: message.content.services,
          });
          this.deleteMessage(message.uuid);
        });
      },
      deep: true
    },
    applicationStateUpdateMessages: {
      handler: function () {
        this.applicationStateUpdateMessages.forEach(message => {
          this.refreshApplications();
          this.deleteMessage(message.uuid)
        })
      },
      deep: true
    },
    incomingApplicationMessages: {
      handler: function () {
        this.incomingApplicationMessages.forEach(message => {
          this.refreshApplications()
          this.deleteMessage(message.uuid)
        })
      },
      deep: true
    },
    servicePolicyValidationMessages: {
      handler: function () {
        this.servicePolicyValidationMessages.forEach(message => {
          var [service_id, policy_validation] = Object.entries(message.content)[0]

          for (const serviceGroup of this.otherServices) {
            const found = serviceGroup.services.find(s => s.service_id == service_id);

            if (found) {
              found.policy_validation = JSON.parse(policy_validation);
              // i think due to vue's reactivity system and the nested object, it does not get there was an update
              // therfore we have to force an update in order for the ui to change
              this.$refs.otherServices.$forceUpdate();
              this.deleteMessage(message.uuid)
              return;
            }
          }
        })
      },
      deep: true
    },
  },
  created: async function () {
    this.refreshServices();
    this.refreshApplications();
  },
  mounted() {
    this.establishListeners()
  },
  methods: {
    ...mapActions('wsMessages', ['deleteMessage']),
    establishListeners() {
      this.$emitter.all.delete('oca-form.save_preview')
      this.$emitter.on('oca-form.save_preview', this.confirmHandler)
      this.$emitter.all.delete('oca-form.reject_preview')
      this.$emitter.on('oca-form.reject_preview', this.rejectApplicationHandler)
    },
    async refreshServices() {
      this.isCreateServiceDialogVisible = false;
      this.isRefreshingService = true;

      await Promise.all([
        this.refreshMyServices(),
        this.refreshOtherServices(),
      ]);

      this.isRefreshingService = false;
    },
    refreshMyServices() {
      return axios.get(`${this.acapyApiUrl}/verifiable-services/self-service-list`)
        .then(r => {
          if (r.status === 200) {
            this.myServices = [];

            if (r.data.result.length > 0) {
              this.myServices.push({
                label: 'Offered by me',
                services: r.data.result
              });
            }
          }
        }).catch(e => {
          console.error(e)
          this.$notify.error('Error occurrde')
        })
    },
    async refreshOtherServices() {
      try {
        const { data: { results } } = await axios.get(`${this.acapyApiUrl}/connections`);

        this.connections = results;
        results
          .filter((conn) => conn.state === 'active' && conn.their_label !== 'ToolBox')
          .forEach((conn) => axios.get(`${this.acapyApiUrl}/verifiable-services/request-service-list/${conn.connection_id}`));
      }
      catch (e) {
        console.error(e)
        this.$notify.error('Could not fetch connections')
      }
    },
    async refreshApplications() {
      this.isRefreshingApplications = true;

      await Promise.all([
        this.refreshSubmittedApplications(),
        this.refreshPendingApplications(),
      ]);

      this.isRefreshingApplications = false;
    },
    refreshSubmittedApplications() {
      return this.$_adminApi_getServiceApplications({
        state: "pending", author: "self"
      }).then(r => {
        if (r.data.success) {
          this.submitted_applications = r.data.result.map(application => {
            const connection = this.connections.find(conn =>
              conn.connection_id == application.connection_id
            )
            return Object.assign(application, {
              payload: application.service_user_data,
              service_schema: application.service_schema,
              consent_schema: application.consent_schema,
              connection: connection
            })
          })
        }
      }).catch(e => {
        console.error(e)
        this.$notify.error('Error occurred')
      })
    },
    refreshPendingApplications() {
      return this.$_adminApi_getServiceApplications({
        state: "pending", author: "other"
      }).then(r => {
        if (r.data.success) {
          this.pending_applications = r.data.result.map(application => {
            const connection = this.connections.find(conn =>
              conn.connection_id == application.connection_id
            )
            return Object.assign(application, {
              payload: application.service_user_data,
              service_schema: application.service_schema,
              consent_schema: application.consent_schema,
              connection: connection
            })
          })
        }
      }).catch(e => {
        console.log(e)
        this.$notify.error('Error occurred')
      })
    },
    collectForms(application, options = [[], []]) {
      Object.assign(this.forms[0][0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives,
          readonly: this.readonlyPreview,
          input: null
        }, options[0][0])
      if (application.schema.answers) {
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
    previewService(service, options = {}) {
      this.previewLabel = 'Service'
      this.readonlyPreview = true
      this.confirmLabel = ""
      this.rejectLabel = ""
      this.reviewablePreview = false
      this.collectForms(service.serviceForm)
      this.$refs.PreviewServiceComponent.openModal()
    },
    collectFormDris(schema, collected = []) {
      const dris = []
      dris.push(schema.form.DRI)
      schema.form.sections.forEach(section => {
        section.row.controls.forEach(control => {
          if (control.type === "reference") {
            dris.push(...this.collectFormDris(control.referenceSchema))
          }
        })
      })
      return [...collected, ...dris]
    },
    applyService(event) {
      this.establishListeners()
      this.dialogContext = "service"
      this.confirmLabel = "Apply"
      this.rejectLabel = ""
      this.currentApplicationService = event
      const formDris = this.collectFormDris(event.serviceForm.schema)
      const schemaDri = event.service.service_schema.oca_schema_dri
      this.$_adminApi_getCurrentData({ schemaDris: formDris })
        .then(r => {
          let input = null
          const schemaFillings = r.data.result
          if (Object.keys(schemaFillings).length > 0) {
            // take item that holds our data
            input = schemaFillings
          }

          this.collectForms(event.serviceForm, [[{ readonly: false, input }], []])

          try {
            this.$refs.PreviewServiceComponent.openModal();
          } catch (e) {
            console.error(e)
            this.$notify.error('Form data are corrupted.')
          }
        })
    },
    previewApplication(application, options = {}) {
      this.establishListeners()
      this.dialogContext = "application"
      this.currentApplication = application
      this.previewLabel = 'Application'
      this.readonlyPreview = options.readonly
      if (options.self) {
        this.confirmLabel = ""
        this.rejectLabel = ""
        this.reviewablePreview = false
      } else {
        this.confirmLabel = "Confirm"
        this.rejectLabel = "Reject"
        this.reviewablePreview = true
      }
      this.collectForms(application)
      this.$refs.PreviewServiceComponent.openModal()
    },
    examineApplication(decision) {
      if (decision == 'accept') { this.confirmProcessing = true }
      else if (decision == 'reject') { this.rejectProcessing = true }

      axios.post(`${this.acapyApiUrl}/verifiable-services/process-application`, {
        decision: decision, issue_id: this.currentApplication.issue_id
      }).then(r => {
        if (r.status === 200) {
          if (typeof r.data === 'string' && r.data.startsWith('-1:')) {
            console.error(r.data)
            this.$notify.error(`Error: ${r.data.split(':')[1]}`)
          } else {
            this.$notify.success(`Application ${decision}ed!`)
            this.refreshApplications();
          }
        }

        if (decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewServiceComponent.closeModal()
      }).catch(e => {
        console.error(e)
        this.$notify.error('Error occurred')

        if (decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewServiceComponent.closeModal()
      })
    },
    confirmHandler(userData) {
      if (this.dialogContext === "service") {
        this.applyOnService(userData)
      } else if (this.dialogContext === "application") {
        this.confirmApplicationHandler()
      }

      this.dialogContext = null
    },
    applyOnService(userData) {
      const { policy_validation, ...service } = this.currentApplicationService.service
      const { consent_id, data: consent_data, usage_policy, ...consent_schema } = this.currentApplicationService.service.consent_schema
      service.consent_schema = consent_schema
      this.$_adminApi_applyOnService({
        connection_id: this.currentApplicationService.connection_id,
        service: service,
        user_data: JSON.stringify(userData)
      }).then(r => {
        if (r.status === 200) {
          if(typeof r.data === 'string' && r.data.startsWith('-1:')) {
            console.error(r.data)
            this.$notify.error(`Error: ${r.data.split(':')[1]}`)
          } else {
            this.$notify.success('Application send!')
          }
        }
        this.confirmProcessing = false
        this.$refs.PreviewServiceComponent.closeModal();
      }).catch(e => {
        console.error(e)
        const { status: code, statusText: msg } = e.response
        this.$notify.error(`Error: ${code} ${msg}`)
        this.confirmProcessing = false
        this.$refs.PreviewServiceComponent.closeModal();
      })
    },
    confirmApplicationHandler() {
      this.examineApplication('accept')
    },
    rejectApplicationHandler() {
      this.examineApplication('reject')
    },
  },
}
</script>
