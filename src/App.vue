<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  import { mapActions } from "vuex"

  export default {
    name: 'aries-toolbox',
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
