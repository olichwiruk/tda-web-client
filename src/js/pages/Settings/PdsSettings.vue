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
import { PreviewComponent } from '../../oca.js-vue'
import { emitter } from '../../../boot/mitt'
import Storage from '../../../storage'

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
      return Storage.get(Storage.Record.AdminApiUrl)
    },
  },
  methods: {
    connectPlugin(data) {
      console.log(data)
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
            this.$notify.success(`${pluginName} plugin connected!`)
          }
        }).catch(e => {
          console.error(e)
          this.$notify.error("Error occurred")
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
      emitter.all.delete('oca-form.save_preview')
      emitter.on('oca-form.save_preview', this.connectPlugin)
      console.log(emitter.all)
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
