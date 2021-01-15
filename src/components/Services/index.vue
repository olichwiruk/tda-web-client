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

        <service-list
          title="My services"
          :services="myServicesSorted"
          @services-refresh="refreshServices"
          @service-preview="previewService($event)"
        />
      </q-card>
    </div>

    <div class="col">
      <q-card class="q-ma-xl">
        <q-banner inline-actions>
          <span class="text-h5">Applications</span>
          <template v-slot:action>
            <!-- <q-btn
            flat
            icon="add"
            @click="isCreateServiceDialogVisible = true"
          ></q-btn> -->
            <q-btn
              flat
              icon="refresh"
              @click="() => { refreshPendingApplications(); refreshSubmittedApplications(); }"
            ></q-btn>
          </template>
        </q-banner>

        <application-list
          title="Pending applications:"
          :list="pending_applications"
          type="pending"
          label='From:'
          @applications-refresh="refreshPendingApplications"
          @application-preview="previewApplication($event, { readonly: false })"
        />
        <application-list
          title="Submitted applications:"
          :list="submitted_applications"
          type="submitted"
          label='To:'
          @applications-refresh="refreshSubmittedApplications"
          @application-preview="previewApplication($event, { readonly: true })"
        />
      </q-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import adminApi from '@/admin_api.ts'

import { mapState, mapActions } from 'vuex'
import NewService from './NewService.vue';
import ServiceList from './ServiceList.vue';
import ApplicationList from './ApplicationList.vue';
//import { eventBus as ocaEventBus, EventHandlerConstant,
//  MultiPreviewComponent } from 'odca-form'

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
    //MultiPreviewComponent
  },
  data() {
    return {
      myServices: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      confirmProcessing: false,
      rejectProcessing: false,
      forms: [
        { class: "col-md-7", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} }
      ],
      submitted_applications: [],
      pending_applications: [],
      isCreateServiceDialogVisible: false,
    }
  },
  computed: {
    ...mapState('WsMessages', ['messages']),
    stateUpdateMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/issue-state-update/'
      })
    },
    incomingApplicationMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/verifiable-services/incoming-pending-application/'
      })
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    fileserverUrl: function() {
      return this.$session.get('localDataVaultUrl')
    },
    myServicesSorted: function() {
      return this.myServices.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    },
  },
  watch: {
    connections: {
      handler: function() {
        this.refreshSubmittedApplications()
        this.refreshPendingApplications()
      },
      deep: true
    },
    stateUpdateMessages: {
      handler: function() {
        this.stateUpdateMessages.forEach(message => {
          this.refreshSubmittedApplications()
          this.refreshPendingApplications()
          this.delete_message(message.uuid)
        })
      },
      deep: true
    },
    incomingApplicationMessages: {
      handler: function() {
        this.incomingApplicationMessages.forEach(message => {
          this.refreshPendingApplications()
          this.delete_message(message.uuid)
        })
      },
      deep: true
    }
  },
  mixins: [
    message_bus(),
    share({
      use: ['connections'],
      actions: []
    }),
    adminApi
  ],
  created: async function() {
    await this.ready();
    this.refreshServices()
    this.refreshSubmittedApplications()
    this.refreshPendingApplications()
  },
  mounted() {
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.confirmApplicationHandler)
    ocaEventBus.$off(EventHandlerConstant.REJECT_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.REJECT_PREVIEW, this.rejectApplicationHandler)
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
    refreshServices() {
      axios.get(`${this.acapyApiUrl}/verifiable-services/self-service-list`)
        .then(r => {
          if (r.status === 200) {
            this.myServices = r.data
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occurrde", { timeout: 1000 })
        })
    },
    refreshSubmittedApplications() {
      this.$_adminApi_getServiceApplications({
        state: "pending", author: "self"
      }).then(r => {
        if (r.status === 200) {
          this.submitted_applications = r.data.map(application => {
            const connection = this.connections.find(conn =>
              conn.connection_id == application.connection_id
            )
            return Object.assign(application, {
              payload: JSON.parse(application.service_user_data),
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
      this.$_adminApi_getServiceApplications({
        state: "pending", author: "other"
      }).then(r => {
        if (r.status === 200) {
          this.pending_applications = r.data.map(application => {
            const connection = this.connections.find(conn =>
              conn.connection_id == application.connection_id
            )
            return Object.assign(application, {
              payload: JSON.parse(application.service_user_data),
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
    previewService(service, options={}) {
      this.previewLabel = 'Service'
      this.readonlyPreview = true
      this.collectForms(service)
      this.$refs.PreviewApplicationComponent.openModal()
    },
    previewApplication(application, options={}) {
      this.currentApplication = application
      this.previewLabel = 'Application'
      this.readonlyPreview = options.readonly
      this.collectForms(application)
      this.$refs.PreviewApplicationComponent.openModal()
    },
    examineApplication(decision) {
      if(decision == 'accept') { this.confirmProcessing = true }
      else if (decision == 'reject') { this.rejectProcessing = true }

      axios.post(`${this.acapyApiUrl}/verifiable-services/process-application`, {
        decision: decision, issue_id: this.currentApplication.issue_id
      }).then(r => {
        if (r.status === 200) {
          if(typeof r.data === 'string' && r.data.startsWith('-1:')) {
            this.$noty.error(`Error occurred. ${r.data.split(':')[1]}`, { timeout: 2000 })
          } else {
            this.$noty.success(`Application ${decision}ed!`, { timeout: 1000 })
            this.refreshPendingApplications()
          }
        }

        if(decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewApplicationComponent.closeModal()
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })

        if(decision == 'accept') { this.confirmProcessing = false }
        else if (decision == 'reject') { this.rejectProcessing = false }
        this.$refs.PreviewApplicationComponent.closeModal()
      })
    },
    confirmApplicationHandler() {
      this.examineApplication('accept')
    },
    rejectApplicationHandler() {
      this.examineApplication('reject')
    },
  }
}
</script>
