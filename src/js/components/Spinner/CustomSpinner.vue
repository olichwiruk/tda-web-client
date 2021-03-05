<template>
  <q-spinner
    v-if="isRunning"
    :color="color"
    size="md"
  />
</template>

<script>
export default {
  props: {
    show: Boolean,
  },
  data: () => ({
    nextStopper: Promise.resolve(),
    isRunning: true,
  }),
  created() {
    if (this.show)
      this.start();
  },
  methods: {
    start() {
      this.isRunning = true;
      this.nextStopper = new Promise((resolve) => {
        setTimeout(() => {
          resolve();

          if (this.show)
            this.start();
          // every 1500 ms there is the chance to stop the animation gracefully
        }, 1500);
      })
    }
  },
  watch: {
    async show(val) {
      if (val)
        this.start();
      else {
        await this.nextStopper;
        this.isRunning = false;
      }
    },
  },
  computed: {
    color() {
      return this.show ? 'black' : 'green';
    }
  }
}
</script>
