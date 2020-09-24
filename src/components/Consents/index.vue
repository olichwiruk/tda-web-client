<template>
  <el-row>
    <new-consent title="Create new consent" />
  </el-row>
</template>

<script>
import axios from 'axios';

import NewConsent from './NewConsent'

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
    NewConsent
  },
  data() {
    return {}
  }
}
</script>
