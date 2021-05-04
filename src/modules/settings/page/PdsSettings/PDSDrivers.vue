<template>
  <span>
    <q-item-label header>
      Available plugins
    </q-item-label>
    <q-separator spaced />

    <div
      class="q-pa-md"
      style="max-width: 350px"
    >
      <q-list
        bordered
        separator
        v-for="driver in driverList"
        :key="driver.type"
      >
        <q-item
          clickable
          v-ripple
          @click="driverClicked(driver)"
        >
          <q-item-section>{{ driver.label }}</q-item-section>
        </q-item>
      </q-list>
    </div>
  </span>
</template>

<script lang="ts">
import { Vue, Emit } from 'vue-property-decorator'
import { $inject as inject } from '@vanroeybe/vue-inversify-plugin'
import { Nullable } from '@/types'
import SI from '@/modules/settings/Identifiers'
import { PDSDriver } from '@/modules/settings/entities'
import {
  FetchPDSDriverList
} from '@/modules/settings/usecases'

export default class PDSDriversComponent extends Vue {
  @inject(SI.SETTINGS.USE_CASE.FETCH_PDS_DRIVER_LIST)
  fetchPDSDriverList!: FetchPDSDriverList

  driverList: Nullable<PDSDriver[]> = null

  async created () {
    this.driverList = await this.fetchPDSDriverList.call()
  }

  @Emit()
  driverClicked (driver: PDSDriver) {
    return driver
  }
}
</script>
