<template >
  <div v-if="list.length">
    <q-list>

      <q-item-label header>{{title}}</q-item-label>
      <q-item
        v-for="connection in list"
        :key="title+connection.connection_id"
      >
        <q-item-section avatar>
          <q-avatar
            :color="getConnectionColor(connection)"
            text-color="white"
            :icon="getConnectionIcon(connection)"
          />
        </q-item-section>
        <q-item-section>{{get_name(connection)}}</q-item-section>
        <q-item-section side>

          <q-btn
            flat
            round
            icon="more_vert"
          >
            <q-menu>
              <q-list style="min-width: 200px;">
                <q-item
                  clickable
                  v-close-popup
                  @click="openPresentationRequest(connection.connection_id)"
                >
                  <q-item-section side>
                    <q-icon name="verified" />
                  </q-item-section>
                  <q-item-section>Request Credential</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  @click="delete_conn(connection)"
                >
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <presentation-request-dialog
      ref="PresentationDialog"
      title="Request Credential"
      @presentation-requested="sendPresentationRequest"
    />

    <!-- <multi-preview-component -->
    <!--   confirmLabel="Apply" -->
    <!--   :confirmProcessing="confirmProcessing" -->
    <!--   :forms="forms" -->
    <!--   :key="forms.map(f => f.formData._uniqueId).join('-')" -->
    <!--   ref="PreviewServiceComponent" -->
    <!-- /> -->
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import adminApi from '@/admin_api.ts'

//import { eventBus as ocaEventBus, EventHandlerConstant,
//  MultiPreviewComponent } from 'odca-form'
import ConnectionServiceList from './ConnectionList/ConnectionServiceList';
import PresentationRequestButton from './ConnectionList/PresentationRequest/Button'
import PresentationRequestDialog from './ConnectionList/PresentationRequest/Dialog'
import { isConnectionActive, isConnectionFailed, isConnectionPending } from './index.vue';

export default {
  name: 'connection-list',
  props: ['title', 'list','editable'],
  components: {
    VueJsonPretty,
    ConnectionServiceList,
    PresentationRequestButton,
    PresentationRequestDialog,
    //MultiPreviewComponent
  },
  data () {
    return {
      expanded_items:[],
      editFormActive: false,
      editForm: {
        connection_id: '',
        role: '',
        label: '',
      },
      forms: [{ class: 'col-md-7', readonly: true, formData: {} },
      { class: 'col-md-5', readonly: true, formData: {} }],
      currentPresentationRequest: {},
      currentApplicationService: {},
      confirmProcessing: false,
      formLabelWidth: '100px'
    }
  },
  mixins: [adminApi],
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  watch: {
    'expanded_items': function(a, b) {
      const connection_id = a.filter(x => !b.includes(x))[0]
      if (connection_id) {
        this.$refs[connection_id][1].fetchServices()
      }
    }
  },
  mounted() {
    // ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    // ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.saveApplicationHandler)
  },
  methods: {
    get_name: function(connection) {
      if('their_label' in connection) {
        return connection.their_label;
      };
      return connection.connection_id;
    },
    edit: function (connection) {
      this.editForm.connection_id = connection.connection_id;
      this.editForm.role = connection.their_role;
      this.editForm.label = connection.their_label;
      this.editFormActive = true;
    },
    update: function() {
      this.editFormActive = false;
      this.$emit('connection-editted', this.editForm);
    },
    delete_conn: function (connection) {
      this.$emit('connection-deleted', connection);
    },
    collapse_expanded: function(connection){
      this.expanded_items = this.expanded_items.filter(
        item => item != connection.connection_id
      );
    },
    openPresentationRequest(connection_id) {
      this.currentPresentationRequest.connection_id = connection_id
      this.$refs.PresentationDialog.isDialogVisible = true
    },
    sendPresentationRequest(event) {
      this.$_adminApi_requestPresentation({
        connection_id: this.currentPresentationRequest.connection_id,
        oca_schema_dri: event.oca_schema_dri
      }).then(r => {
        console.log(r)
        this.$noty.success("Request for presentation send!", { timeout: 2000 })
      })
    },
    collectForms(event, options) {
      Object.assign(this.forms[0],
        {
          label: event.serviceForm.schema.form.label,
          formData: event.serviceForm.schema.form,
          alternatives: event.serviceForm.schema.formAlternatives
        }, options[0])
      Object.assign(this.forms[1],
        {
          label: event.serviceForm.consent.form.label,
          formData: event.serviceForm.consent.form,
          alternatives: event.serviceForm.consent.formAlternatives,
          input: event.serviceForm.consent.answers
        }, options[1])
    },
    servicePreview(event) {
      this.collectForms(event, [{ readonly: true }])

      try {
        this.$refs.PreviewServiceComponent.openModal();
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    serviceApply(event) {
      this.currentApplicationService = event
      this.collectForms(event, [{ readonly: false }])

      try {
        this.$refs.PreviewServiceComponent.openModal();
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    saveApplicationHandler(data) {
      const ref = this.$parent.$children.find(child => (
        child.$el.className == 'activeConnections'
      ))
      if(ref) { ref.sendApplication(data) }
    },
    sendApplication(data) {
      if(!this.$refs.PreviewServiceComponent) { return }
      this.confirmProcessing = true

      this.$_adminApi_applyOnService({
        connection_id: this.currentApplicationService.connection_id,
        service: this.currentApplicationService.service,
        user_data: JSON.stringify(data)
      }).then(r => {
        console.log(r.data)
        if (r.status === 200) {
          if(typeof r.data === 'string' && r.data.startsWith('-1:')) {
            this.$noty.error(`Error: ${r.data.split(':')[1]}`, { timeout: 2000 })
          } else {
            this.$noty.success("Application send!", { timeout: 1000 })
          }
        }

        this.confirmProcessing = false
        this.$refs.PreviewServiceComponent.closeModal();
      }).catch(e => {
        console.error(e)
        const { status: code, statusText: msg } = e.response
        this.$noty.error(`Error: ${code} ${msg}`, { timeout: 1000 })

        this.confirmProcessing = false
        this.$refs.PreviewServiceComponent.closeModal();
      })
    },
    getConnectionColor(connection) {
      if (isConnectionActive(connection))
        return 'teal';
      else if (isConnectionPending(connection))
        return 'orange';
      else
        return 'red';
    },
    getConnectionIcon(connection) {
      if (isConnectionActive(connection))
        return 'done';
      else if (isConnectionPending(connection))
        return 'sync';
      else
        return 'error_outline';
    },
  }
}
</script>
