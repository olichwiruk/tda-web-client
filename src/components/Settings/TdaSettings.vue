<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <el-form label-width="auto">
        <el-form-item label="Developer mode:">
          <el-checkbox v-model="isDevUi">
          </el-checkbox>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'tda-settings',
  props: ['title'],
  data() {
    return {
      isDevUi: this.$session.get('isDevUi')
    }
  },
  watch: {
    isDevUi: function() {
      this.$session.set('isDevUi', this.isDevUi)
      this.$router.go()
    },
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
