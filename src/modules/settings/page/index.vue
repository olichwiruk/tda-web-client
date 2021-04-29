<template>
  <q-page class="q-pa-md">
    <div style="max-width:450px">
      <q-list
        bordered
        padding
      >
        <pds-settings title="PDS" />
        <controller-settings title="Controller Configuration" />
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-property-decorator'

import PDSSettingsComponent from './PdsSettings.vue'
import ControllerSettingsComponent from './ControllerSettings.vue'

@Options({
  components: {
    PdsSettings: PDSSettingsComponent,
    ControllerSettings: ControllerSettingsComponent
  }
})
export default class Settings extends Vue {
}
</script>
