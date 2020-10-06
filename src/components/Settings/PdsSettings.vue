<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <current-pds />
      <pds-plugins />
    </div>
  </div>
</template>

<script>
import CurrentPds from './PdsSettings/CurrentPds'
import PdsPlugins from './PdsSettings/PdsPlugins'

export default {
  name: 'pds-settings',
  props: ['title'],
  components: {
    CurrentPds,
    PdsPlugins
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
