<template>
  <div>
    <q-list padding>

    <q-item>
      <q-form
        class="q-gutter-md"
      >
      <q-select
          filled
          v-model="active_pds"
          use-input
          input-debounce="0"
          label="Select Data Store"
          :options="pds_list"
          @update:modelValue="pds_selected"
          style="width: 250px"
        >
          <template v-slot:no-option>
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

<script>
import axios from 'axios';
import Storage from '../../../../storage'

export default {
  name: 'current-pds',
  components: {
  },
  data() {
    return {
      pds_list: [],
      active_pds: null
    }
  },
  computed: {
    acapyApiUrl: function() {
      return Storage.get(Storage.Record.AdminApiUrl)
    },
  },
  methods: {
    pds_selected(pds) {
      console.log(pds)
      const [pds_type, pds_name] = pds.split(', ')
      axios.post(`${this.acapyApiUrl}/pds/activate?type=${pds_type}&optional_name=${pds_name}`)
    },
    refreshPdsList() {
      axios.get(`${this.acapyApiUrl}/pds`)
        .then(r => {
          if (r.status === 200) {
            this.active_pds = r.data.active
          }
        }).catch(e => {
          console.error(e)
          this.$notify.error('Error occurred')
        })

      axios.get(`${this.acapyApiUrl}/pds/settings`)
        .then(r => {
          if (r.status === 200) {
            this.pds_list = Object.keys(r.data)
          }
        }).catch(e => {
          console.error(e)
          this.$notify.error('Error occurred')
        })
    }
  },
  mounted() {
    this.refreshPdsList()
  }
}
</script>
