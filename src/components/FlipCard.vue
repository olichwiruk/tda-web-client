<template>
  <div v-bind:class="flipped ? 'flip-container flipped': 'flip-container'">
    <div class="flipper">
      <div class="front">
        <q-card class="card" flat bordered>
          <slot name="front"></slot>
        </q-card>
        <q-icon name="qr_code" class="frontFlipBtn"
            v-on:click="flipped=true"/>
      </div>
      <div class="back">
        <q-card class="card" flat bordered>
          <slot name="back"></slot>
        </q-card>
        <q-icon v-if="flipped" name="style" class="backFlipBtn"
            v-on:click="flipped=false"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlipCard',
  data: function () {
    return {
      flipped: false
    }
  }
}
</script>

<style type='text/css' scoped>
  .card {
    min-height: 300px;
    max-width: 400px;
  }
  i.frontFlipBtn,
  i.backFlipBtn {
      position:absolute;
      right: 0.2em;
      top: 0.2em;
      color:#000;
      font-size: 3em;
      background: #fff;
  }
  .flip-container {
    -webkit-perspective: 1000;
    -moz-perspective: 1000;
    -o-perspective: 1000;
    perspective: 1000;
  }
  .flip-container {
    min-height: 120px;
  }
  .flipper {
    -moz-transform: perspective(1000px);
    -moz-transform-style: preserve-3d;
    position: relative;
  }
  .front,
  .back {
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -o-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-transition: 0.6s;
    -webkit-transform-style: preserve-3d;
    -moz-transition: 0.6s;
    -moz-transform-style: preserve-3d;
    -o-transition: 0.6s;
    -o-transform-style: preserve-3d;
    -ms-transition: 0.6s;
    -ms-transform-style: preserve-3d;
    transition: 0.6s;
    transform-style: preserve-3d;
    top: 0;
    left: 0;
    width: 100%;
  }
  .back {
    -webkit-transform: rotateY(-180deg);
    -moz-transform: rotateY(-180deg);
    -o-transform: rotateY(-180deg);
    -ms-transform: rotateY(-180deg);
    transform: rotateY(-180deg);
    position: absolute;
  }
  .flip-container.flipped .back {
    -webkit-transform: rotateY(0deg);
    -moz-transform: rotateY(0deg);
    -o-transform: rotateY(0deg);
    -ms-transform: rotateY(0deg);
    transform: rotateY(0deg);
  }
  .flip-container.flipped .front {
    -webkit-transform: rotateY(180deg);
    -moz-transform: rotateY(180deg);
    -o-transform: rotateY(180deg);
    -ms-transform: rotateY(180deg);
    transform: rotateY(180deg);
  }
  .front {
    z-index: 2;
  }
</style>
