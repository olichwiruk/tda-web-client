<template>
  <div class="container">
    <el-button type="primary" size="small" @click="$emit('click')">{{ title }}</el-button>
  </div>
</template>

<script>
export default {
  name: 'presentation-request-button',
  props: ['title', 'connection'],
  data () {
    return {
    }
  },
}
</script>

<style scoped>
  .container {
    padding-left: 0;
    margin: 0 0 15px 0;
  }
</style>
