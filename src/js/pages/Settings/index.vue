<template>
  <q-page class="q-pa-md">
  <div style="max-width:450px">
    <q-list bordered padding>
      <pds-settings title="Personal Data Storage" />
      <controller-settings title="Controller Configuration" />
    </q-list>
  </div>
  </q-page>
</template>

<script>
import PdsSettings from './PdsSettings.vue'
import ControllerSettings from './ControllerSettings.vue'

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
