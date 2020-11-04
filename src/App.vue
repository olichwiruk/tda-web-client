<template>
  <div id="app">
    <router-view></router-view>
    <WebSocket/>
  </div>
</template>

<script>
  import WebSocket from './components/WebSocket.vue';
  import { mapActions } from "vuex"

  export default {
    name: 'aries-toolbox',
    components: { WebSocket },
    created() {
      if (this.$session.exists()) {
        let connections = this.$session.get('connections');
        if (connections) {
          connections.forEach(connection => {
            this.add_agent(connection)
          })
        }
      }
    },
    methods: {
      ...mapActions("Agents", ["add_agent"])
    }
  }
</script>

<style>
  /* CSS */
</style>
