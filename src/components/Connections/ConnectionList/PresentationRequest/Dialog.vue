<template>
  <div>
    <q-dialog
      v-model="isDialogVisible"
      persistent
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">{{title}}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <oca-schema-search
            label="Schema"
            :ocaRepoHost="ocaRepoHost"
            @schemaSelected="(form) => ocaForm = form"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
          />
          <q-btn
            flat
            label="Request"
            color="primary"
            :disable="!ocaForm"
            v-close-popup
            @click="request_pesentation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import OcaSchemaSearch from '@/components/Services/NewService/OcaSchemaSearch.vue'

export default {
  name: 'presentation-request-dialog',
  props: { title: String },
  components: { OcaSchemaSearch },
  data() {
    return {
      isDialogVisible: false,
      ocaForm: null,
      formLabelWidth: '200px',
    }
  },
  watch: {
    isDialogVisible() {
      // always reset the dialog when it is (re-)opened
      if (this.isDialogVisible)
        this.ocaForm = null;
    }
  },
  computed: {
    ocaRepoUrl: function () {
      return this.$session.get('ocaRepoUrl')
    },
    ocaRepoHost: function () {
      return this.$session.get('ocaRepoUrl')
    },
  },
  methods: {
    deactivate() {
      this.isDialogVisible = false
    },
    request_pesentation() {
      this.$emit('presentation-requested', {
        oca_schema_dri: this.ocaForm.DRI,
      })
      this.deactivate()
    },
  }
}
</script>

<style scoped>
</style>
