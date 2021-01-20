<template>
  <q-spinner
    v-if="showSpinner"
    size="md"
  />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    show: Boolean,
  },
  data: () => ({
    minTimeExpired: true,
  }),
  created() {
    if (this.show)
      this.start();
  },
  methods: {
    start() {
      this.minTimeExpired = false;
      setTimeout(() => this.minTimeExpired = true, 1500);
    },
  },
  watch: {
    show(val) {
      if (val)
        this.start();
    }
  },
  computed: {
    showSpinner(): boolean {
      return this.show || !this.minTimeExpired;
    }
  }
})
</script>