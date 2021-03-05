<template>
  <q-select
    outlined
    v-model="selectedConsent"
    :options="consent_list"
    :label="label"
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No results
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import axios from 'axios'
import Storage from '../../../../storage'

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
      return Storage.get(Storage.Record.AdminApiUrl)
    },
  },
  watch: {
    'selectedConsent': function() {
      this.$emit('consentSelected', this.selectedConsent)
    }
  },
  async mounted() {
    await axios.get(`${this.acapyApiUrl}/verifiable-services/consents`)
      .then(r => {
        if (r.status === 200) {
          this.consent_list = r.data.result
        }
      })
  },
  methods: {}
}
</script>
