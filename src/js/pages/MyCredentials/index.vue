<template>
  <q-page class="q-pa-md">
    <my-credentials-list
      title="Documents"
      editable="false"
      :list="credentials"
      :connections="activeConnections"
      @cred-refresh="fetch_credentials"
      ></my-credentials-list>
  </q-page>
</template>

<script>
import axios from 'axios'

import { mapGetters } from 'vuex'
import MyCredentialsList from './MyCredentialsList.vue';
import Storage from '../../../storage'

export default {
  name: 'my-credentials',
  components: {
    MyCredentialsList
  },
  data: () => {
    return {
      credentials: []
    }
  },
  computed: {
    ...mapGetters('agentCommunication', ['activeConnections']),
    acapyApiUrl: function() {
      return Storage.get(Storage.Record.AdminApiUrl)
    },
  },
  mounted() {
    this.fetch_credentials()
  },
  methods: {
    fetch_credentials: function() {
      axios.get(`${this.acapyApiUrl}/credentials`).then(r => {
        this.credentials = r.data.result
      })
    }
  },
  created: function() {
    this.fetch_credentials();
  }
}
</script>
