<template>
  <div>
    <q-list padding>
      <q-item>
        <q-form
          class="q-gutter-md"
        >
          <q-select
            filled
            v-model="activePds"
            use-input
            input-debounce="0"
            label="Select Data Store"
            :options="pdsList"
            :option-value="opt => opt"
            :option-label="opt => (`[${opt.label}] ${opt.name}`)"
            @update:modelValue="pdsSelected"
            style="width: 350px"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No results
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-form>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts">
import { $inject as inject } from '@vanroeybe/vue-inversify-plugin'
import { Vue } from 'vue-property-decorator'
import SI from '@/modules/settings/Identifiers'
import ActivatePDS from '@/modules/settings/usecases/ActivatePDS'
import FetchActivePDS from '@/modules/settings/usecases/FetchActivePDS'
import FetchPDSList from '@/modules/settings/usecases/FetchPDSList'
import { Nullable } from '@/types'
import PDS from '@/modules/settings/entities/PDS'

export default class CurrentPDSComponent extends Vue {
  @inject(SI.SETTINGS.USE_CASE.ACTIVATE_PDS)
  activatePDS!: ActivatePDS

  @inject(SI.SETTINGS.USE_CASE.FETCH_ACTIVE_PDS)
  fetchActivePDS!: FetchActivePDS

  @inject(SI.SETTINGS.USE_CASE.FETCH_PDS_LIST)
  fetchPDSList!: FetchPDSList

  activePds: Nullable<PDS> = null
  pdsList: PDS[] = []

  async created () {
    await this.refreshPdsList()
  }

  async refreshPdsList () {
    this.pdsList = await this.fetchPDSList.call()
    this.activePds = await this.fetchActivePDS.call()
  }

  pdsSelected (pds: PDS) {
    this.activatePDS.call(pds)
  }
}
</script>
