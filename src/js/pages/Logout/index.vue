<template>
  <q-page class="q-pa-md">
  </q-page>
</template>

<script>
import Storage from '../../../storage'

export default {
  name: 'logout',
  created () {
    Storage.remove(Storage.Record.AgentConnection)
    Storage.remove(Storage.Record.AdminApiUrl)
    Storage.remove(Storage.Record.WebsocketUrl)

    this.$router.push({ name: 'login' }).catch(e => console.error(e))
  }
}
</script>
