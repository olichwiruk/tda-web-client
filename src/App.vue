<template>
  <div id="app">
    <router-view></router-view>
    <WebSocket :key="$session.get('websocketUrl')" />
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
        this.$session.get('connections').forEach(connection => {
          this.add_agent(connection)
        })
      } else {
        this.$session.start()
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
