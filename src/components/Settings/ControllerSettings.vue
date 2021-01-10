<template>
  <div class="q-pa-md" style="max-width: 400px">
    <div class="text-h5">
      {{ title }}
    </div>

    <q-form
      @submit="onSubmit"
      @reset="onReset"
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

      <q-input
        filled
        v-model="localDataVaultUrl"
        label="DataVault URL"
        lazy-rules
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />

    </q-form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'controller-settings',
  props: ['title'],
  data() {
    return {
      acapyApiUrl: this.$session.get('acapyApiUrl'),
      websocketUrl: this.$session.get('websocketUrl'),
      localDataVaultUrl: this.$session.get('localDataVaultUrl'),
      ocaRepoUrl: this.$session.get('ocaRepoUrl')
    }
  },
  watch: {
    acapyApiUrl: function() {
      this.$session.set('acapyApiUrl', this.acapyApiUrl)
    },
    websocketUrl: function() {
      this.$session.set('websocketUrl', this.websocketUrl)
    },
    localDataVaultUrl: function() {
      this.$session.set('localDataVaultUrl', this.localDataVaultUrl)
    },
    ocaRepoUrl: function() {
      this.$session.set('ocaRepoUrl', this.ocaRepoUrl)
    }
  }
}
</script>

<style scoped>
</style>
