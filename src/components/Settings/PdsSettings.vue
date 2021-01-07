<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <current-pds ref="CurrentPdsComponent" />
      <pds-plugins
        @configure-plugin="previewPluginConfig($event)" />
    </div>

    <preview-component ref="PluginConfigPreviewComponent"
      :readonly="false" confirmLabel="Connect"
      :form="pluginForm" :alternatives="pluginAlternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios';

import CurrentPds from './PdsSettings/CurrentPds'
import PdsPlugins from './PdsSettings/PdsPlugins'

import { eventBus as ocaEventBus, EventHandlerConstant,
  PreviewComponent } from 'oca.js-vue'

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
      this.previewPluginName = event.pluginName
      this.pluginAlternatives = event.plugin.formAlternatives
      this.$refs.PluginConfigPreviewComponent.openModal(event.plugin.form)
    },
  },
  mounted() {
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.connectPlugin)
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
