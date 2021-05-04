<template>
  <q-page class="q-pa-md">
    <div style="max-width:450px">
      <q-list
        bordered
        padding
      >
        <pds-settings
          title="PDS"
          @driver-clicked="onPDSDriverClicked"
        />
        <controller-settings title="Controller Configuration" />
      </q-list>
    </div>
  </q-page>

  <oca-form-modal
    ref="ocaFormModal"
    confirm-label="Connect"
    :readonly="false"
    :form="{}"
    :alternatives="[]"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Vue, Options, Ref } from 'vue-property-decorator'
import { PDSDriver } from '@/modules/settings/entities'

import PDSSettingsComponent from './PdsSettings.vue'
import ControllerSettingsComponent from './ControllerSettings.vue'
import { $inject as inject } from '@vanroeybe/vue-inversify-plugin'
import {
  FormModalComponent as OCAFormModalComponent,
  Identifiers as SI_OCA,
  Form as OCAForm,
  FetchForm as FetchOCAForm
} from '@/modules/common/oca'
import { Nullable, Dictionary } from '@/types'
import { emitter } from '@/boot/mitt'

@Options({
  components: {
    PdsSettings: PDSSettingsComponent,
    ControllerSettings: ControllerSettingsComponent,
    OcaFormModal: (OCAFormModalComponent as ReturnType<typeof defineComponent>)
  }
})
export default class Settings extends Vue {
  @Ref() ocaFormModal!: OCAFormModalComponent

  @inject(SI_OCA.COMMON.OCA.USE_CASE.FETCH_FORM)
  fetchOCAForm!: FetchOCAForm

  openedOCAForm: Nullable<OCAForm> = null

  mounted () {
    this.establishListeners()
  }

  establishListeners () {
    emitter.all.delete('oca-form.save_preview')
    emitter.on('oca-form.save_preview', (e: Nullable<Dictionary>) => this.connectPlugin(e))
  }

  onPDSDriverClicked (driver: PDSDriver) {
    this.openOCAFormModal(driver.ocaSchemaDri)
  }

  openOCAFormModal (dri: string) {
    this.openedOCAForm = this.fetchOCAForm.call(dri)
    this.ocaFormModal.openModal(this.openedOCAForm) // eslint-disable-line
  }

  connectPlugin (e: Nullable<Dictionary>) {
    console.log(this.openedOCAForm)
    console.log(e)
  }
}
</script>
