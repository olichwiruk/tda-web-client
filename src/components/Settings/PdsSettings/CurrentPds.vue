<template>
  <div>
    <el-form @submit.native.prevent :inline="true">
      <el-form-item label="Current PDS:">
        <el-select
          v-model="active_pds"
          filterable
          placeholder="Select PDS"
          @change="pds_selected">
          <el-option
            v-for="pds in pds_list"
            :key="pds" :label="pds" :value="pds">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
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
      const [pds_type, pds_name] = pds.split(',')
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
