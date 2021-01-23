<template>
    <q-list padding>
      <q-item-label header>{{title}}</q-item-label>
      <q-separator spaced />

      <current-pds ref="CurrentPdsComponent" />
      <pds-plugins
        @configure-plugin="previewPluginConfig($event)" />

    <preview-component
      confirmLabel="Connect"
      ref="PluginConfigPreviewComponent"
      :readonly="false"
      :form="pluginForm"
      :alternatives="pluginAlternatives"
    ></preview-component>
  </q-list>
</template>

<script>
import axios from 'axios';

import CurrentPds from './PdsSettings/CurrentPds'
import PdsPlugins from './PdsSettings/PdsPlugins'
import {
  eventBus as ocaEventBus,
  EventHandlerConstant,
  PreviewComponent
} from '@/oca.js-vue'


export default {
  name: 'pds-settings',
  props: ['title'],
  components: {
    CurrentPds,
    PdsPlugins,
    PreviewComponent
  },
  data() {
    return {
      pluginForm: {},
      pluginAlternatives: [],
      previewPluginName: null
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  methods: {
    connectPlugin(data) {
      const settings = {}
      const pluginName = this.previewPluginName
      if (data.api_url && data.api_url.includes("https://data-vault.eu")) {
        delete data.scope
      }
      settings[this.previewPluginName] = data

      axios.post(`${this.acapyApiUrl}/pds/settings`, { "settings": settings })
        .then(r => {
          console.log(r)
          if (r.status === 200) {
            this.$refs.CurrentPdsComponent.refreshPdsList()
            this.$noty.success(`${pluginName} plugin connected!`, { timeout: 1000 })
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occurred", { timeout: 1000 })
        })
      this.$refs.PluginConfigPreviewComponent.closeModal()
      this.previewPluginName = null
    },
    previewPluginConfig(event) {
      this.establishListeners()
      this.previewPluginName = event.pluginName
      this.pluginAlternatives = event.plugin.formAlternatives
      this.$refs.PluginConfigPreviewComponent.openModal(event.plugin.form)
    },
    establishListeners() {
      ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
      ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.connectPlugin)
    }
  },
  mounted() {
    this.establishListeners()
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
