<template>
  <q-page class="q-pa-md">
    <div style="max-width:450px">
      <q-list
        bordered
        padding
      >
        <controller-settings title="Controller Configuration" />
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-property-decorator'

import ControllerSettingsComponent from './ControllerSettings.vue'

@Options({
  components: {
    ControllerSettings: ControllerSettingsComponent
  }
})
export default class Settings extends Vue {
}
</script>
