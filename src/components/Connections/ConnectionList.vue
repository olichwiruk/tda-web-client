<template >
  <div v-if="list.length">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">{{ title }}</a>
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('refresh',)"></el-button>
    </nav>
    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="(connection) in list"
          v-bind:title="get_name(connection)"
          :name="connection.connection_id"
          :key="title+connection.connection_id">
          <el-row>
            <div>
              <vue-json-pretty :deep=0 :data="connection" />
              <presentation-request-button
                title="Ask For Presentation"
                @click="openPresentationRequest(connection.connection_id)"
                :ref="connection.connection_id"
                :connection="connection" />
              <connection-presentation-list title="Presentations:"
                :ref="connection.connection_id"
                :connection="connection"
                :presentations="presentations"
                :presentationPayloads="presentationPayloads"
                @presentation-preview="presentationPreview" />
              <connection-service-list title="Services:"
                :ref="connection.connection_id"
                :connection="connection"
                @service-preview="servicePreview"
                @service-apply="serviceApply" />
            </div>
            <template v-if="editable">
              <el-button @click="edit(connection)">Edit</el-button>
            </template>
            <el-button type="danger" @click="delete_conn(connection)">Delete</el-button>
            <el-button v-on:click="collapse_expanded(connection)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <el-dialog title="Edit Connection" :visible.sync="editFormActive">
      <el-form :model="editForm">
        <el-form-item label="Role:" :label-width="formLabelWidth">
          <el-input v-model="editForm.role" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Label:" :label-width="formLabelWidth">
          <el-input v-model="editForm.label" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editFormActive = false">Cancel</el-button>
        <el-button type="primary" @click="update">Confirm</el-button>
      </span>
    </el-dialog>

    <presentation-request-dialog ref="PresentationDialog"
      title="Presentation Request"
      @presentation-requested="sendPresentationRequest"/>

    <multi-preview-component confirmLabel="Apply" :confirmProcessing="confirmProcessing"
      :forms="forms" :key="forms.flat().map(f => f.formData._uniqueId).join('-')"
      ref="PreviewServiceComponent" />
    <preview-component ref="PresentationPreviewComponent" :readonly="true" :form="presentation.form" :alternatives="presentation.alternatives"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import adminApi from '@/admin_api.ts'

import { mapState, mapActions } from 'vuex'

import { eventBus as ocaEventBus, EventHandlerConstant,
  MultiPreviewComponent, PreviewComponent } from 'oca.js-vue'
import ConnectionServiceList from './ConnectionList/ConnectionServiceList';
import ConnectionPresentationList from './ConnectionList/ConnectionPresentationList';
import PresentationRequestButton from './ConnectionList/PresentationRequest/Button'
import PresentationRequestDialog from './ConnectionList/PresentationRequest/Dialog'

export default {
  name: 'connection-list',
  props: ['title', 'list','editable'],
  components: {
    VueJsonPretty,
    ConnectionServiceList,
    ConnectionPresentationList,
    PresentationRequestButton,
    PresentationRequestDialog,
    MultiPreviewComponent,
    PreviewComponent
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
      forms: [[{ class: 'col-md-7', readonly: true, formData: {} }],
        [{ class: 'col-md-5', readonly: true, formData: {} },
        { class: 'col-md-5', readonly: true, formData: {} }]
      ],
      currentPresentationRequest: {},
      currentApplicationService: {},
      confirmProcessing: false,
      formLabelWidth: '100px',
      presentations: [],
      presentationPayloads: {},
      presentation: {
        form: {},
        alternatives: []
      }
    }
  },
  mixins: [adminApi],
  computed: {
    ...mapState('WsMessages', ['messages']),
    pdsPayloadMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/pds/payload/'
      })
    },
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  watch: {
    pdsPayloadMessages: {
      handler: function() {
        this.pdsPayloadMessages.forEach(msg => {
          const payload = JSON.parse(msg.content.payload)
          this.presentationPayloads[msg.content.dri] = Object.values(payload)[0].p
          this.delete_message(msg.uuid)
        })
      }
    },
    'expanded_items': function(a, b) {
      const connection_id = a.filter(x => !b.includes(x))[0]
      if (connection_id) {
        const serviceListIndex = this.$refs[connection_id].findIndex(ref => {
          return ref.fetchServices
        })
        if (serviceListIndex != -1) {
          this.$refs[connection_id][serviceListIndex].fetchServices()
        }
      }
    }
  },
  mounted() {
    this.$_adminApi_getPresentations()
      .then(r => this.presentations = r.data.result.filter(p =>
        (
          "state" in p &&
          ( p.state === "verified" ||
            p.state === "presentation_acked" ||
            p.state === "presentation_received")
        ) &&
        "role" in p && p.role === "verifier"
      ))
    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.saveApplicationHandler)
  },
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
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
      this.$refs.PresentationDialog.active = true
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
      Object.assign(this.forms[0][0],
        {
          label: event.serviceForm.schema.form.label,
          formData: event.serviceForm.schema.form,
          alternatives: event.serviceForm.schema.formAlternatives,
          input: null
        }, options[0][0])
      Object.assign(this.forms[1][0],
        {
          label: event.serviceForm.consent.form.label,
          formData: event.serviceForm.consent.form,
          alternatives: event.serviceForm.consent.formAlternatives,
          input: event.serviceForm.consent.answers
        }, options[1][0])
      Object.assign(this.forms[1][1],
        {
          label: event.serviceForm.usagePolicy.form.label,
          formData: event.serviceForm.usagePolicy.form,
          alternatives: event.serviceForm.usagePolicy.formAlternatives,
          input: event.serviceForm.usagePolicy.answers
        }, options[1][1])
    },
    presentationPreview(event) {
      this.presentation.form = event.presentationForm.form
      this.presentation.alternatives = event.presentationForm.formAlternatives

      try {
        this.$refs.PresentationPreviewComponent.openModal(
          this.presentation.form,
          event.presentationForm.payload
        );
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    servicePreview(event) {
      this.collectForms(event, [[{ readonly: true }], []])

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
      const schemaDri = event.service.service_schema.oca_schema_dri
      this.$_adminApi_getCurrentData({ schemaDris: [schemaDri] })
        .then(r => {
          let input = null
          const schemaFillings = r.data.result[schemaDri]
          if (schemaFillings.length > 0) {
            input = schemaFillings[0].content.p
          }

          this.collectForms(event, [[{ readonly: false, input }], []])

          try {
            this.$refs.PreviewServiceComponent.openModal();
          } catch(e) {
            console.log(e)
            this.$noty.error("ERROR! Form data are corrupted.", {
              timeout: 1000
            })
          }
        })
    },
    saveApplicationHandler(data) {
      const ref = this.$parent.$children.find(child => (
        child.$el.className == 'activeConnections'
      ))
      this.$_adminApi_saveCurrentData({ data })
      if(ref) { ref.sendApplication(data) }
    },
    sendApplication(data) {
      if(!this.$refs.PreviewServiceComponent) { return }
      this.confirmProcessing = true

      const { policy_validation, ...service } = this.currentApplicationService.service
      const { consent_id, data: consent_data, usage_policy, ...consent_schema } = this.currentApplicationService.service.consent_schema
      service.consent_schema = consent_schema

      this.$_adminApi_applyOnService({
        connection_id: this.currentApplicationService.connection_id,
        service: service,
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
    }
  }
}
</script>
