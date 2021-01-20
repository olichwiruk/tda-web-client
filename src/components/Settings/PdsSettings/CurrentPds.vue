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
          @input="pds_selected"
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
      return this.$session.get('acapyApiUrl')
    },
  },
  methods: {
    pds_selected(pds) {
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
          console.log(e)
          this.$noty.error("Error occurred", { timeout: 1000 })
        })

      axios.get(`${this.acapyApiUrl}/pds/settings`)
        .then(r => {
          if (r.status === 200) {
            this.pds_list = Object.keys(r.data)
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occurred", { timeout: 1000 })
        })
    }
  },
  mounted() {
    this.refreshPdsList()
  }
}
</script>
