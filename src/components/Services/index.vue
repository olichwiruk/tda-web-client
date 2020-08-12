<template>
  <el-row>
    <new-service title="Create new service"
      @services-refresh="refreshServices" />
    <service-list title="My services" :services="myServicesSorted"
      @services-refresh="refreshServices" />
    <application-list
      title="Pending applications:"
      :list="pending_applications"
      label='From:'
      @application-preview="previewApplication($event, { readonly: false })" />
    <application-list
      title="Submitted applications:"
      :list="submitted_applications"
      label='To:'
      @application-preview="previewApplication($event, { readonly: true })" />

    <multi-preview-component label="Application" confirmLabel="Confirm"
      :readonly="readonlyPreview" :forms="forms"
      :key="forms.map(f => f.formData._uniqueId).join('-')"
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
      readonlyPreview: true,
      currentApplication: {},
      forms: [
        { class: "col-md-7", readonly: true, formData: {} },
        { class: "col-md-5", readonly: true, formData: {} }
      ]
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
    pending_applications: function() {
      return [{
        label: "Health Card",
        connection_id: "asd",
        connection_label: "Marian",
        service_id: "xyz",
        consent_schema: {
          data_url: `${this.fileserverUrl}/api/v1/files/zQmPsU57nqWY8jzndU9AE2RK4EXvjMLGmytVpUNxfRpm18G`,
          oca_schema_namespace: "consent",
          oca_schema_dri: "fArVHJTQSKHu2CeXJocQmH3HHxzZXsuQD7kzyHJhQ49s",
        },
        service_schema: {
          oca_schema_namespace: "hcf",
          oca_schema_dri: "gffA2i9tCexTwQ1S6JsXxJ8JEMHfTdaMtggBjX6jvF8N",
        }
      }]
    },
    submitted_applications: function() {
      return [{
        label: "Health Card",
        connection_id: "asd",
        connection_label: "Hospital",
        service_id: "xyz",
        consent_schema: {
          data_url: `${this.fileserverUrl}/api/v1/files/zQmPsU57nqWY8jzndU9AE2RK4EXvjMLGmytVpUNxfRpm18G`,
          oca_schema_namespace: "consent",
          oca_schema_dri: "fArVHJTQSKHu2CeXJocQmH3HHxzZXsuQD7kzyHJhQ49s",
        },
        service_schema: {
          oca_schema_namespace: "hcf",
          oca_schema_dri: "gffA2i9tCexTwQ1S6JsXxJ8JEMHfTdaMtggBjX6jvF8N",
        }
      }]
    },
  },
  mixins: [
    message_bus(),
    share({
      use: [],
      actions: []
    })
  ],
  created: async function() {
    await this.ready();
    this.refreshServices()
  },
  mounted() {
    if(ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]) {
      ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW] =
        ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]
          .filter(f => f.name != this.saveApplicationHandler.name)
    }

    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.confirmApplicationHandler)
  },
  methods: {
    refreshServices() {
      axios.get(`${this.acapyApiUrl}/service-discovery/get-list-self`)
        .then(r => {
          if (r.status === 200) {
            this.myServices = r.data
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occuerrd", { timeout: 1000 })
        })
    },
    collectForms(application, options=[]) {
      Object.assign(this.forms[0],
        {
          label: application.schema.form.label,
          formData: application.schema.form,
          alternatives: application.schema.formAlternatives,
          input: application.schema.answers
        }, options[0])
      Object.assign(this.forms[1],
        {
          label: application.consent.form.label,
          formData: application.consent.form,
          alternatives: application.consent.formAlternatives,
          input: application.consent.answers
        }, options[1])
    },
    previewApplication(application, options={}) {
      this.currentApplication = application
      this.readonlyPreview = options.readonly
      this.collectForms(application)
      this.$refs.PreviewApplicationComponent.openModal()
    },
    confirmApplicationHandler() {
      console.log(this.currentApplication)
      this.$refs.PreviewApplicationComponent.closeModal()
    }
  }
}
</script>
