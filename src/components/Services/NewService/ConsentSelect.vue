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
            :value="consent.label">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import adminApi from '@/admin_api.ts'

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
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  mixins: [adminApi],
  watch: {
    'selectedConsent': function() {
      const consent = this.consent_list.find(c => c.label == this.selectedConsent)
      this.$emit('consentSelected', consent)
    }
  },
  async mounted() {
    await this.$_adminApi_getConsents()
      .then(r => {
        if (r.status === 200) {
          this.consent_list = r.data.result
        }
      })
  },
  methods: {}
}
</script>
