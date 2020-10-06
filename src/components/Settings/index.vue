<template>
  <el-row>
    <pds-settings title="Personal Data Storage" />
  </el-row>
</template>

<script>

import PdsSettings from './PdsSettings.vue'

export const metadata = {
  menu: {
    label: 'Settings',
    icon: 'el-icon-setting',
    group: 'Other',
    priority: 200,
    required_protocols: []
  }
};

export const shared = {
  data: {},
  listeners: {}
}

export default {
  name: 'settings',
  components: {
    PdsSettings
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>
