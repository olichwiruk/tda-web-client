<template>
  <div></div>
</template>

<script>
  import { mapActions } from "vuex"

  const WS_STATE = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }

  export default {
    name: 'WebSocket',
    data: function() {
      return {
        ws: null
      }
    },
    computed: {
      websocketUrl: function() {
        return this.$session.get('websocketUrl')
      }
    },
    methods: {
      ...mapActions("WsMessages", ["add_message"]),
      openWebsocketConnection() {
          if(!this.websocketUrl) { return }
          this.ws = new WebSocket(this.websocketUrl)
          const vm = this

          vm.ws.onopen = function () {
              vm.ws.onmessage = function (wsMessage) {
                  const data = JSON.parse(wsMessage.data)
                  const topic = data.topic
                  const content = JSON.parse(data['message'])
                  vm.add_message({ topic, content })
              }
              console.log("WebSocket connected")
          }
      },
      heartbeat() {
        if (this.ws.readyState == WS_STATE.CLOSED) {
          this.openWebsocketConnection()
        }
        setTimeout(this.heartbeat, 10000)
      }
    },
    mounted() {
        this.openWebsocketConnection()
        this.heartbeat()
    },
  }
</script>

<style>
</style>
