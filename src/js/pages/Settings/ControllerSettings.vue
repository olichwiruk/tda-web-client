<template>
  <div class="q-pa-md" style="max-width: 400px">
    <div class="text-h5">
      {{ title }}
    </div>

    <q-form
      class="q-gutter-md"
    >
      <q-input
        filled
        v-model="acapyApiUrl"
        label="Acapy admin API URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

      <q-input
        filled
        v-model="websocketUrl"
        label="WebSocket server URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

      <q-input
        filled
        v-model="ocaRepoUrl"
        label="OCA Repo URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

    </q-form>
  </div>
</template>

<script>
import axios from 'axios';
import Storage from '../../../storage'

export default {
  name: 'controller-settings',
  props: ['title'],
  data() {
    return {
      acapyApiUrl: Storage.get(Storage.Record.AdminApiUrl),
      websocketUrl: Storage.get(Storage.Record.WebsocketUrl),
      ocaRepoUrl: Storage.get(Storage.Record.OcaRepoUrl)
    }
  },
  watch: {
    acapyApiUrl: function() {
      Storage.set(Storage.Record.AdminApiUrl, this.acapyApiUrl)
    },
    websocketUrl: function() {
      Storage.set(Storage.Record.WebsocketUrl, this.websocketUrl)
    },
    ocaRepoUrl: function() {
      Storage.set(Storage.Record.OcaRepoUrl, this.ocaRepoUrl)
    }
  }
}
</script>

<style scoped>
</style>
