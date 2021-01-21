<template>
  <div class="row">
    <q-dialog
      v-model="isCreateServiceDialogVisible"
      persistent
    >
      <new-service
        title="Offer new service"
        @services-refresh="refreshServices"
      />
    </q-dialog>

    <div class="col">
      <q-card class="q-ma-xl">
        <q-banner inline-actions>
          <span class="text-h5">Services</span>
          <template v-slot:action>
            <custom-spinner :show="isRefreshingService" />

            <q-btn
              flat
              icon="add"
              @click="isCreateServiceDialogVisible = true"
            ></q-btn>
            <q-btn
              flat
              icon="refresh"
              @click="refreshServices"
            ></q-btn>
          </template>
        </q-banner>

        <q-list v-if="showEmptyMessage">
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

    <div class="col">
      <q-card class="q-ma-xl">
        <q-banner inline-actions>
          <span class="text-h5">Applications</span>
          <template v-slot:action>
            <custom-spinner :show="isRefreshingApplications" />

            <q-btn
              flat
              icon="refresh"
              @click="refreshApplications"
            ></q-btn>
          </template>
        </q-banner>

        <application-list
          title="Pending applications:"
          :list="pending_applications"
          type="pending"
          label='From:'
          @applications-refresh="refreshApplications"
          @application-preview="previewApplication($event, { readonly: false })"
        />
        <application-list
          title="Submitted applications:"
          :list="submitted_applications"
          type="submitted"
          label='To:'
          @applications-refresh="refreshApplications"
          @application-preview="previewApplication($event, { readonly: true })"
        />
      </q-card>
    </div>

    <multi-preview-component
      confirmLabel="Apply"
      :confirmProcessing="confirmProcessing"
      :forms="forms"
      :key="forms.flat().map(f => f.formData._uniqueId).join('-')"
      ref="PreviewServiceComponent"
    />
  </div>
</template>

<script>
import axios from 'axios';
import adminApi from '@/admin_api.ts'

import { mapState, mapActions } from 'vuex'
import NewService from './NewService.vue';
import ServiceList from './ServiceList.vue';
import ApplicationList from './ApplicationList.vue';
import CustomSpinner from '../Spinner/CustomSpinner.vue';

import {
  eventBus as ocaEventBus,
  EventHandlerConstant,
  MultiPreviewComponent,
} from '@/oca.js-vue'

import message_bus from '@/message_bus.ts';
import share from '@/share.ts';

export const metadata = {
  menu: {
    label: 'Services',
    icon: 'el-icon-goods',
    group: 'Agent to Agent',
    priority: 110,
    required_protocols: []
  }
};

export const shared = {
  data: {},
  listeners: {}
}

export default {
  name: 'services',
  components: {
    NewService,
    ServiceList,
    ApplicationList,
    CustomSpinner,
    MultiPreviewComponent
  },
  data() {
    return {
      myServices: [],
      otherServices: [],
      connections: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      confirmProcessing: false,
      rejectProcessing: false,
      forms: [
        [{ class: "col-md-7", readonly: true, formData: {} }],
        [{ class: "col-md-5", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} }]
      ],
      submitted_applications: [],
      pending_applications: [],
      isCreateServiceDialogVisible: false,
      isRefreshingService: false,
      isRefreshingApplications: false,
    }
  },
  computed: {
    ...mapState('WsMessages', ['messages']),
    stateUpdateMessages: function () {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/issue-state-update/'
      })
    },
    incomingApplicationMessages: function () {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/incoming-pending-application/'
      })
    },
    acapyApiUrl: function () {
      return this.$session.get('acapyApiUrl')
    },
    fileserverUrl: function () {
      return this.$session.get('localDataVaultUrl')
    },
    myServicesSorted: function () {
      if (Array.isArray(this.myServices))
        return this.myServices.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at)
        })

      return [];
    },
    serviceListMessages: function () {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/request-service-list/'
      })
    },
    servicePolicyValidationMessages: function () {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/request-service-list/usage-policy/'
      })
    },
    allServices() {
      return [
        ...this.myServices,
        ...this.otherServices,
      ];
    },
    showEmptyMessage() {
      return this.allServices.filter(group => group.services.length > 0) == 0;
    }
  },
  watch: {
    connections: {
      handler: function () {
        this.refreshApplications();
      },
      deep: true
    },
    stateUpdateMessages: {
      handler: function () {
        this.stateUpdateMessages.forEach(message => {
          this.refreshApplications();
          this.delete_message(message.uuid)
        })
      },
      deep: true
    },
    incomingApplicationMessages: {
      handler: function () {
        this.incomingApplicationMessages.forEach(message => {
          this.refreshApplications()
          this.delete_message(message.uuid)
        })
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
          this.delete_message(message.uuid);
        });
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
              this.delete_message(message.uuid)
              return;
            }
          }
        })
      },
      deep: true
    },
  },
  mixins: [
    message_bus(),
    share({
      actions: []
    }),
    adminApi
  ],
  created: async function () {
    await this.ready();

    this.refreshServices();
    this.refreshApplications();
  },
  mounted() {
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.confirmApplicationHandler)
    ocaEventBus.$off(EventHandlerConstant.REJECT_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.REJECT_PREVIEW, this.rejectApplicationHandler)
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
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
          console.log(e)
          this.$noty.error("Error occurrde", { timeout: 1000 })
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
        this.$noty.error("Could not fetch connections", { timeout: 1000 })
        console.log(e)
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
            const service_user_data = JSON.parse(application.service_user_data)
            const payload = Object.values(service_user_data)[0].p
            return Object.assign(application, {
              payload,
              service_schema: JSON.parse(application.service_schema),
              consent_schema: JSON.parse(application.consent_schema),
              connection: connection
            })
          })
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })
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
            const service_user_data = JSON.parse(application.service_user_data)
            const payload = Object.values(service_user_data)[0].p
            return Object.assign(application, {
              payload,
              service_schema: JSON.parse(application.service_schema),
              consent_schema: JSON.parse(application.consent_schema),
              connection: connection
            })
          })
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })
      })
    },
    collectForms(application, options = [[], []]) {
      Object.assign(this.forms[0][0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives
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
      Object.assign(this.forms[1][1],
        {
          label: application.usagePolicy.form.label,
          formData: application.usagePolicy.form,
          alternatives: application.usagePolicy.formAlternatives,
          input: application.usagePolicy.answers
        }, options[1][1])
    },
    previewService(service, options = {}) {
      this.previewLabel = 'Service'
      this.readonlyPreview = true
      this.collectForms(service)
      this.$refs.PreviewServiceComponent.openModal()
    },
    applyService(event) {
      this.currentApplicationService = event
      const schemaDri = event.service.service_schema.oca_schema_dri
      this.$_adminApi_getCurrentData({ schemaDris: [schemaDri] })
        .then(r => {
          let input = null
          const schemaFillings = r.data.result[schemaDri]
          if (schemaFillings.length > 0) {
            // take item that holds our data
            input = schemaFillings.find(x => x.content && x.content.p).content.p
          }

          this.collectForms(event, [[{ readonly: false, input }], []])

          try {
            this.$refs.PreviewServiceComponent.openModal();
          } catch (e) {
            console.log(e)
            this.$noty.error("ERROR! Form data are corrupted.", {
              timeout: 1000
            })
          }
        })
    },
    previewApplication(application, options = {}) {
      this.currentApplication = application
      this.previewLabel = 'Application'
      this.readonlyPreview = options.readonly
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
            this.$noty.error(`Error occurred. ${r.data.split(':')[1]}`, { timeout: 2000 })
          } else {
            this.$noty.success(`Application ${decision}ed!`, { timeout: 1000 })
            this.refreshApplications();
          }
        }

        if (decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewServiceComponent.closeModal()
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })

        if (decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewServiceComponent.closeModal()
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
