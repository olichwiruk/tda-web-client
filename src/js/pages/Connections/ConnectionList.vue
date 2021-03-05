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
                >
                  <!-- @click="delete_conn(connection)" -->
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
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import adminApi from '../../admin_api'
import Storage from '../../../storage'
// import ConnectionServiceList from './ConnectionList/ConnectionServiceList';
import PresentationRequestButton from './ConnectionList/PresentationRequest/Button'
import PresentationRequestDialog from './ConnectionList/PresentationRequest/Dialog'

export default {
  name: 'connection-list',
  props: ['title', 'list','editable'],
  components: {
    PresentationRequestButton,
    PresentationRequestDialog,
  },
  data () {
    return {
      currentPresentationRequest: {},
    }
  },
  mixins: [adminApi],
  computed: {
    acapyApiUrl: function() {
      return Storage.get(Storage.Record.AdminApiUrl)
    },
  },
  methods: {
    get_name: function(connection) {
      if('their_label' in connection) {
        return connection.their_label;
      };
      return connection.connection_id;
    },
    /*
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
    */
    openPresentationRequest(connection_id) {
      this.currentPresentationRequest.connection_id = connection_id
      this.$refs.PresentationDialog.isDialogVisible = true
    },
    sendPresentationRequest(event) {
      this.$_adminApi_requestPresentation({
        connection_id: this.currentPresentationRequest.connection_id,
        oca_schema_dri: event.oca_schema_dri
      }).then(r => {
        this.$notify.success('Request for presentation send!')
      })
    },
    getConnectionColor(connection) {
      return 'teal';
      /*
      if (isConnectionActive(connection))
        return 'teal';
      else if (isConnectionPending(connection))
        return 'orange';
      else
        return 'red';
        */
    },
    getConnectionIcon(connection) {
      return 'done';
      /*
      if (isConnectionActive(connection))
        return 'done';
      else if (isConnectionPending(connection))
        return 'sync';
      else
        return 'error_outline';
        */
    },
  }
}
</script>
