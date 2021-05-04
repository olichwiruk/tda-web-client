<template>
  <q-list padding>
    <q-item-label header>
      {{ title }}
    </q-item-label>
    <q-separator spaced />

    <current-pds />
    <pds-drivers
      @driver-clicked="driverClicked"
    />
  </q-list>
</template>

<script lang="ts">
import { Vue, Options, Prop, Emit } from 'vue-property-decorator'
import CurrentPDSComponent from './PdsSettings/CurrentPds.vue'
import PDSDriversComponent from './PdsSettings/PDSDrivers.vue'
import { PDSDriver } from '@/modules/settings/entities'

@Options({
  components: {
    CurrentPds: CurrentPDSComponent,
    PdsDrivers: PDSDriversComponent
  }
})
export default class PDSSettingsComponent extends Vue {
  @Prop() title: string

  @Emit()
  driverClicked (driver: PDSDriver) {
    return driver
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
