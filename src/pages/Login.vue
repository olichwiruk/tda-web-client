<template>
  <q-layout>
    <q-page-container>
      <q-page class="center">
        <q-card flat>
          <header class="text-h4 text-center q-pa-lg">
            Trusted Digital Assistant
          </header>
          <q-linear-progress indeterminate />
          <div class="q-pa-lg space-between">
            <q-img
              class="q-ma-md logo-image"
              :src="oydImageUrl"
            />
            <q-img
              class="q-ma-md logo-image"
              :src="hcfImageUrl"
            />
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import hcfLogo from '../assets/logo_hcf.png'
import oydLogo from '../assets/logo_oyd.png'

export default class Login extends Vue {
  get hcfImageUrl () { return hcfLogo }
  get oydImageUrl () { return oydLogo }
}
</script>

<style scoped>
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.space-between {
  display: flex;
  justify-content: space-between;
}
</style>
