<template>
  <el-row>
    <new-service title="Create new service"
      @services-refresh="refreshServices" />
    <service-list title="My services" :services="myServicesSorted"
      @services-refresh="refreshServices"
      @service-preview="previewService($event)" />
    <application-list
      title="Pending applications:"
      :list="pending_applications"
      label='From:'
      @applications-refresh="refreshPendingApplications"
      @application-preview="previewApplication($event, { readonly: false })" />
    <application-list
      title="Submitted applications:"
      :list="submitted_applications"
      label='To:'
      @applications-refresh="refreshSubmittedApplications"
      @application-preview="previewApplication($event, { readonly: true })" />

    <multi-preview-component :label="previewLabel" confirmLabel="Confirm"
      :confirmProcessing="confirmProcessing" :readonly="readonlyPreview"
      :forms="forms" :key="forms.map(f => f.formData._uniqueId).join('-')"
      ref="PreviewApplicationComponent" />
  </el-row>
</template>

<script>
import axios from 'axios';

import NewService from './NewService.vue';
import ServiceList from './ServiceList.vue';
import ApplicationList from './ApplicationList.vue';
import { eventBus as ocaEventBus, EventHandlerConstant,
  MultiPreviewComponent } from 'odca-form'

import message_bus from '@/message_bus.js';
import share from '@/share.js';

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
    MultiPreviewComponent
  },
  data() {
    return {
      myServices: [],
      previewLabel: '',
      readonlyPreview: true,
      currentApplication: {},
      confirmProcessing: false,
      refreshApplicationsFrequency: 1000,
      refreshApplicationsMaxCount: 5,
      forms: [
        { class: "col-md-7", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} }
      ],
      submitted_applications: [],
      pending_applications: []
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    fileserverUrl: function() {
      return `${config.env.VUE_APP_PROTOCOL}://${config.env.VUE_APP_DATA_VAULT}.${config.env.VUE_APP_HOST}`
    },
    myServicesSorted: function() {
      return this.myServices.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    },
  },
  mixins: [
    message_bus(),
    share({
      use: ['connections'],
      actions: []
    })
  ],
  created: async function() {
    await this.ready();
    this.refreshServices()
    this.refreshSubmittedApplications()
    this.refreshPendingApplications()
  },
  mounted() {
    if(ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]) {
      ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW] =
        ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]
          .filter(f => f.name != this.confirmApplicationHandler.name)
    }

    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.confirmApplicationHandler)
  },
  methods: {
    refreshServices() {
      axios.get(`${this.acapyApiUrl}/verifiable-services/fetch-self`)
        .then(r => {
          if (r.status === 200) {
            this.myServices = r.data
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occurrde", { timeout: 1000 })
        })
    },
    async refreshSubmittedApplications() {
      let count = 0
      let fullResponse = false
      let connectionsLoaded = this.connections.length > 0

      while(!connectionsLoaded || (count < this.refreshApplicationsMaxCount && !fullResponse)) {
        axios.post(`${this.acapyApiUrl}/verifiable-services/get-issue-self`, {
          state: "pending", author: "self"
        }).then(r => {
          console.log(r.data)
          if (r.status === 200) {
            count += 1
            fullResponse = r.data.every(a => a.payload)
            connectionsLoaded = this.connections.length > 0
            this.submitted_applications = r.data.map(application => {
              const connection = this.connections.find(conn =>
                conn.connection_id == application.connection_id
              )
              return Object.assign(application, {
                payload: JSON.parse(application.payload),
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
        await new Promise(r => setTimeout(r, this.refreshApplicationsFrequency));
      }
    },
    async refreshPendingApplications() {
      let count = 0
      let fullResponse = false
      let connectionsLoaded = this.connections.length > 0

      while(!connectionsLoaded || (count < this.refreshApplicationsMaxCount && !fullResponse)) {
        axios.post(`${this.acapyApiUrl}/verifiable-services/get-issue-self`, {
          state: "pending", author: "other"
        }).then(r => {
          console.log(r.data)
          if (r.status === 200) {
            count += 1
            fullResponse = r.data.every(a => a.payload)
            this.pending_applications = r.data.map(application => {
              const connection = this.connections.find(conn => 
                conn.connection_id == application.connection_id
              )
              return Object.assign(application, {
                payload: JSON.parse(application.payload),
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
        await new Promise(r => setTimeout(r, this.refreshApplicationsFrequency));
      }
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
    confirmApplicationHandler() {
      this.confirmProcessing = true

      axios.post(`${this.acapyApiUrl}/verifiable-services/process-application`, {
        decision: "accept", issue_id: this.currentApplication.issue_id
      }).then(r => {
        console.log(r.data)
        if (r.status === 200) {
          if(typeof r.data === 'string' && r.data.startsWith('-1:')) {
            this.$noty.error("Error occurred. Be sure your active DID is published on ledger", { timeout: 2000 })
          } else {
            this.$noty.success("Application accepted!", { timeout: 1000 })
            this.refreshPendingApplications()
          }
        }
        this.confirmProcessing = false
        this.$refs.PreviewApplicationComponent.closeModal()
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })

        this.confirmProcessing = false
        this.$refs.PreviewApplicationComponent.closeModal()
      })
    },
  }
}
</script>
