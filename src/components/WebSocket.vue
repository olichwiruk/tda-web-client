<template>
  <div></div>
</template>

<script>
  export default {
    name: 'WebSocket',
    computed: {
      websocketUrl: function() {
        return this.$session.get('websocketUrl')
      }
    },
    methods: {
      openWebsocketConnection() {
          if(!this.websocketUrl)  { return }
          const ws = new WebSocket(this.websocketUrl)

          ws.onopen = function () {
              ws.onmessage = function (message) {
                  const message_json = JSON.parse(message.data)
                  const topic_info = JSON.parse(message_json['message'])

                  console.log(message)
                  console.log("\n----------------\n")
                  console.log(message_json)
                  console.log("\n----------------\n")
                  console.log(topic_info)
                  // console.log(message_json['request'])
                  console.log("\n----------------\n")
                  console.log("\n----------------\n")
                  console.log("\n----------------\n")
              }
              console.log("Connected")
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
