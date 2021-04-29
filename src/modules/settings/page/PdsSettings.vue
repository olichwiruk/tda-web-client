<template>
  <q-list padding>
    <q-item-label header>
      {{ title }}
    </q-item-label>
    <q-separator spaced />

    <current-pds />
  </q-list>
</template>

<script lang="ts">
import { Vue, Options, Prop } from 'vue-property-decorator'
import CurrentPDSComponent from './PdsSettings/CurrentPds.vue'

@Options({
  components: {
    CurrentPds: CurrentPDSComponent
  }
})
export default class PDSSettingsComponent extends Vue {
  @Prop() title: string
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
