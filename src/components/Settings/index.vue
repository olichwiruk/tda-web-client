<template>
  <el-row>
    <pds-settings title="Personal Data Storage" />
    <controller-settings title="Controller Configuration" />
    <tda-settings title="TDA Configuration" />
  </el-row>
</template>

<script>
import PdsSettings from './PdsSettings.vue'
import ControllerSettings from './ControllerSettings.vue'
import TdaSettings from './TdaSettings.vue'

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
    PdsSettings,
    ControllerSettings,
    TdaSettings
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>
