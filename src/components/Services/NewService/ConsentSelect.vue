<template>
  <div>
    <el-form>
      <el-form-item :label="label" label-width="80px">
        <el-select
          v-model="selectedConsent"
          width="400px"
          no-data-text="No consents found"
          placeholder="Consent">
          <el-option
            v-for="consent in consent_list"
            :key="consent.label"
            :label="consent.label"
            :value="consent">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import axios from 'axios'
import { get_consents } from '@/storage/persistence'

export default {
  name: 'consent-select',
  props: ['label'],
  components: {},
  data() {
    return {
      consent_list: [],
      selectedConsent: null
    }
  },
  computed: {
    instanceUuid: function() {
      return this.$session.get('instanceUuid')
    },
    instanceAgent: function() {
      return this.$session.get('instanceAgent')
    }
  },
  watch: {
    'selectedConsent': function() {
      this.$emit('consentSelected', this.selectedConsent)
    }
  },
  mounted() {
    this.consent_list = get_consents({
      instanceUuid: this.instanceUuid,
      instanceAgent: this.instanceAgent
    })
  },
  methods: {}
}
</script>
