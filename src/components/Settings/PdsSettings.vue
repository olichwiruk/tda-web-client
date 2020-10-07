<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <current-pds />
      <pds-plugins
        @configure-plugin="previewPluginConfig($event)" />
    </div>

    <preview-component ref="PluginConfigPreviewComponent"
      :readonly="false" confirmLabel="Connect"
      :form="pluginForm" :alternatives="pluginAlternatives"></preview-component>
  </div>
</template>

<script>
import CurrentPds from './PdsSettings/CurrentPds'
import PdsPlugins from './PdsSettings/PdsPlugins'

import { eventBus as ocaEventBus, EventHandlerConstant,
  PreviewComponent } from 'odca-form'

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
      pluginAlternatives: []
    }
  },
  methods: {
    connectPlugin(data) {
      console.log(data)
      this.$noty.success("Plugin Connected!", { timeout: 1000 })
      this.$refs.PluginConfigPreviewComponent.closeModal()
    },
    previewPluginConfig(event) {
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
