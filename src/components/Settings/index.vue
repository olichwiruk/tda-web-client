<template>
  <q-page>
    <pds-settings title="Personal Data Storage" />
    <controller-settings title="Controller Configuration" />
  </q-page>
</template>

<script>
import PdsSettings from './PdsSettings.vue'
import ControllerSettings from './ControllerSettings.vue'

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
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>
