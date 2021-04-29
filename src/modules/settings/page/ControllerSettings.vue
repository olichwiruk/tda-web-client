<template>
  <div
    class="q-pa-md"
    style="max-width: 400px"
  >
    <div class="text-h5">
      {{ title }}
    </div>

    <q-form
      class="q-gutter-md"
    >
      <q-input
        filled
        v-model="settings.acapyApiUrl"
        label="Acapy admin API URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

      <q-input
        filled
        v-model="settings.websocketUrl"
        label="WebSocket server URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

      <q-input
        filled
        v-model="settings.ocaRepoUrl"
        label="OCA Repo URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />
    </q-form>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Watch } from 'vue-property-decorator'
import { $inject as inject } from '@vanroeybe/vue-inversify-plugin'
import { Nullable } from '@/types'
import SI from '@/modules/settings/Identifiers'

import { ControllerSettings } from '@/modules/settings/entities'
import {
  FetchControllerSettings,
  SaveControllerSettings
} from '@/modules/settings/usecases'

export default class ControllerSettingsComponent extends Vue {
  @Prop() title: string

  @inject(SI.SETTINGS.USE_CASE.FETCH_CONTROLLER_SETTINGS)
  fetchControllerSettings!: FetchControllerSettings

  @inject(SI.SETTINGS.USE_CASE.SAVE_CONTROLLER_SETTINGS)
  saveControllerSettings!: SaveControllerSettings

  settings: Nullable<ControllerSettings> = null

  created () {
    this.settings = this.fetchControllerSettings.call()
  }

  @Watch('settings', { deep: true })
  onSettingsChanged (val: ControllerSettings, oldVal: Nullable<ControllerSettings>) {
    if (!oldVal) { return }
    this.updateConfig(val)
  }

  updateConfig (config: ControllerSettings) {
    this.saveControllerSettings.call(config)
  }
}
</script>

<style scoped>
</style>
