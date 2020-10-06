<template>
  <div>
    <el-form @submit.native.prevent :inline="true">
      <el-form-item label="Current PDS:">
        <el-select
          v-model="activePdsName"
          filterable
          placeholder="Select PDS"
          @change="pds_selected">
          <el-option
            v-for="pds in pds_list"
            :key="pds.pdsName"
            :label="pds.pdsName"
            :value="pds.pdsName">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'current-pds',
  components: {
  },
  data() {
    return {
      pds_list: [],
      activePdsName: null
    }
  },
  methods: {
    pds_selected(pdsName) {
      console.log(pdsName)
    }
  },
  mounted() {
    this.pds_list.push({ pdsName: 's3', active: false })
    this.pds_list.push({ pdsName: 'oyd', active: true })

    const activePds = this.pds_list.find(el => el.active)
    this.activePdsName = activePds ? activePds.pdsName : ''
  }
}
</script>
