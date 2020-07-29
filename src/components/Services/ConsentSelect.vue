<template>
  <div>
    <el-form>
      <el-form-item :label="label" label-width="200px">
        <el-select
          v-model="selectedConsentDRI"
          width="400px"
          no-data-text="No consents found"
          placeholder="Consent">
          <el-option
            v-for="consentData in consentsData"
            :key="consentData.DRI"
            :label="`Expiration: ${consentData.expiration}; ` +
              `Limitation: ${consentData.limitation}; ` +
              `Dictated by: ${consentData.dictatedBy}; ` +
              `Validity TTL: ${consentData.validityTTL};`"
            :value="consentData.DRI">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'consent-select',
  props: ['dataVaultHost', 'label'],
  components: {},
  data() {
    return {
      consentsData: [],
      selectedConsentDRI: null
    }
  },
  computed: {
    consentAnswers: function() {
      return [
        "zQmNeoZGfo1chKACu9RLrVoG4afjLrGnAz1rhsfvGZwg9Z3",
        "zQmPsU57nqWY8jzndU9AE2RK4EXvjMLGmytVpUNxfRpm18G"
      ]
    }
  },
  watch: {
    'selectedConsentDRI': function() {
      this.$emit('consentSelected', this.selectedConsentDRI)
    }
  },
  created() {
    this.consentAnswers.forEach(DRI => {
      axios.get(`${this.dataVaultHost}/api/v1/files/${DRI}`).then(r => { 
        this.consentsData.push({ DRI, ...r.data })
      })
    })
  },
  methods: {}
}
</script>
