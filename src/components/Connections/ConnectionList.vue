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

    <preview-component class="modal__left" style="z-index: 9999;" ref="ApplyServiceComponent" :readonly="false" :form="{}" :alternatives="serviceFormAlternatives"></preview-component>
    <preview-component class="modal__left" style="z-index: 9999;" ref="PreviewServiceComponent" :readonly="true" :form="{}" :alternatives="serviceFormAlternatives"></preview-component>
    <preview-component class="modal__right" style="z-index: 9999;" ref="PreviewConsentComponent" :readonly="true" :form="{}" :alternatives="consentFormAlternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios'
import VueJsonPretty from 'vue-json-pretty';

import { eventBus as ocaEventBus, EventHandlerConstant,
  PreviewComponent } from 'odca-form'
import ConnectionServiceList from './ConnectionList/ConnectionServiceList';

export default {
  name: 'connection-list',
  props: ['title', 'list','editable'],
  components: {
    VueJsonPretty,
    ConnectionServiceList,
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
      serviceFormAlternatives: [],
      consentFormAlternatives: [],
      currentApplicationService: {},
      formLabelWidth: '100px'
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
  },
  watch: {
    'expanded_items': function(a, b) {
      const connection_id = a.filter(x => !b.includes(x))[0]
      if (connection_id) {
        this.$refs[connection_id][0].fetchServices()
      }
    }
  },
  mounted() {
    if(ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]) {
      ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW] =
        ocaEventBus._events[EventHandlerConstant.SAVE_PREVIEW]
          .filter(f => f.name != this.saveApplicationHandler.name)
    }

    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.saveApplicationHandler)
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
    previewConsent(consent) {
      try {
        this.consentFormAlternatives = consent.formAlternatives
        this.$refs.PreviewConsentComponent.openModal(
          consent.form, consent.answers
        );
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    servicePreview(event) {
      this.previewConsent(event.service.consent)
      try {
        this.serviceFormAlternatives = event.service.schema.formAlternatives
        this.$refs.PreviewServiceComponent.openModal(event.service.schema.form);
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Form data are corrupted.", {
          timeout: 1000
        })
      }
    },
    serviceApply(event) {
      this.currentApplicationService = event
      this.previewConsent(event.service.consent)
      try {
        this.serviceFormAlternatives = event.service.schema.formAlternatives
        this.$refs.ApplyServiceComponent.openModal(event.service.schema.form);
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
      this.$refs.ApplyServiceComponent.closeModal();
      this.$refs.PreviewConsentComponent.closeModal();

      axios.post(`${this.acapyApiUrl}/verifiable-services/apply`, {
        connection_id: this.currentApplicationService.connection_id,
        service_id: this.currentApplicationService.service.id
      }).then(r => {
        console.log(r.data)
        if (r.status === 200) {
          this.$noty.success("Application send!", { timeout: 1000 })
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })
      })
    }
  }
}
</script>
