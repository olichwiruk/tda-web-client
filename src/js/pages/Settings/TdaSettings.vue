<template>
  <div class="q-pa-md" style="max-width: 400px">
    <div class="text-h5">
      {{ title }}
    </div>

    <q-form
      @submit="onSubmit"
      @reset="onReset"
      class="q-gutter-md"
    >
      <q-toggle
        v-model="isDevUi"
        label="Developer mode"
        left-label
      />

    </q-form>
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
