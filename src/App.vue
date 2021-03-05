<template>
  <router-view />
  <web-socket />
</template>
<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import WebSocket from './js/components/WebSocket.vue'

@Options({
  components: {
    WebSocket
  }
})
export default class App extends Vue {}
</script>
