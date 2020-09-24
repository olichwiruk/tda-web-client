<template>
  <el-row>
    <new-consent title="Create new consent"
      @consents-refresh="refreshConsents" />
    <consent-list title="My consents" :consents="consent_list"
      @consents-refresh="refreshConsents"
      @consent-preview="previewConsent($event)" />

    <preview-component :readonly="true" ref="PreviewConsentComponent" :form="{}" :alternatives="alternatives"></preview-component>
  </el-row>
</template>

<script>
import axios from 'axios';
import { get_consents } from '@/storage/persistence'
import { PreviewComponent } from 'odca-form'
import NewConsent from './NewConsent'
import ConsentList from './ConsentList'

export const metadata = {
  menu: {
    label: 'Consents',
    icon: 'el-icon-goods',
    group: 'Agent to Agent',
    priority: 120,
    required_protocols: []
  }
};

export default {
  name: 'consents',
  components: {
    NewConsent,
    ConsentList,
    PreviewComponent
  },
  data() {
    return {
      consent_list: [],
      alternatives: []
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
  methods: {
    refreshConsents() {
      this.consent_list = get_consents({
        instanceUuid: this.instanceUuid,
        instanceAgent: this.instanceAgent
      })
    },
    previewConsent(event) {
      this.alternatives = event.formAlternatives
      this.$refs.PreviewConsentComponent.openModal(event.form, event.answers)
    }
  },
  mounted() {
    this.refreshConsents()
  }
}
</script>
