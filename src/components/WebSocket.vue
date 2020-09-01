<template>
  <div></div>
</template>

<script>
  import { mapActions } from "vuex"

  export default {
    name: 'WebSocket',
    computed: {
      websocketUrl: function() {
        return this.$session.get('websocketUrl')
      }
    },
    methods: {
      ...mapActions("WsMessages", ["add_message"]),
      openWebsocketConnection() {
          if(!this.websocketUrl)  { return }
          const vm = this
          const ws = new WebSocket(this.websocketUrl)

          ws.onopen = function () {
              ws.onmessage = function (wsMessage) {
                  const data = JSON.parse(wsMessage.data)
                  const topic = data['topic']
                  const content = JSON.parse(data['message'])
                  vm.add_message({ topic, content })
              }
              console.log("WebSocket connected")
          }
      }
    },
    mounted() {
        this.openWebsocketConnection()
    },
  }
</script>

<style>
</style>
