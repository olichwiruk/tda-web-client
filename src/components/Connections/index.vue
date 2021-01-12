<template>
  <q-card class="q-ma-xl">
    <q-dialog v-model="isUrlDialogVisible">
      <q-card style="min-width: 50vw">
        <q-card-section>
          <div class="text-h6">Invitation URL</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            dense
            v-model="invitation"
            autofocus
            hint="https://example.com"
            @keyup.enter="prompt = false"
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            flat
            label="Cancel"
            v-close-popup
          />
          <q-btn
            flat
            label="Connect"
            @click="recieve_invitation"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Contacts</q-toolbar-title>
      <q-btn
        flat
        icon="add"
        @click="isUrlDialogVisible = true"
      ></q-btn>
      <q-btn
        flat
        icon="refresh"
        @click="fetch_connections"
      ></q-btn>
    </q-toolbar>
    <connection-list
      title="Active Connections:"
      editable="true"
      class="activeConnections"
      :list="active_connections"
      @connection-editted="update_connection"
      @connection-deleted="delete_connection"
      @refresh="fetch_connections"></connection-list>
    <connection-list
      title="Pending Connections:"
      editable="true"
      :list="pending_connections"
      @connection-editted="update_connection"
      @connection-deleted="delete_connection"></connection-list>
    <connection-list
      title="Failed Connections:"
      editable="false"
      :list="failed_connections"
      @connection-editted="update_connection"
      @connection-deleted="delete_connection"></connection-list>

    <!-- <p>Add connection from invitation:</p>
    <el-form @submit.native.prevent>
      <el-form-item
        label="Invitation URL:">
        <el-input
          style="width: 300px;"
          v-model="invitation">
          <el-button
            slot="append"
            type="primary"
            icon="el-icon-plus"
            @click="recieve_invitation">Add</el-button>
        </el-input>
      </el-form-item>
    </el-form>
  </el-row> -->
  </q-card>
</template>

<script>
import ConnectionList from './ConnectionList.vue';
import share from '@/share.ts';
import message_bus from '@/message_bus.ts';

export const isConnection = (conn) => "state" in conn;

export const isConnectionActive = (conn) => isConnection(conn) &&
  conn.their_label !== 'ToolBox' &&
  (conn.state === "active" || conn.state === "response");
export const isConnectionPending = (conn) => isConnection(conn) &&
  conn.state !== "active" &&
  conn.state !== "invitation" &&
  conn.state !== "error" &&
  conn.state !== "response"
export const isConnectionFailed = (conn) => isConnection(conn) &&
  conn.state === "error"

export const metadata = {
  menu: {
    label: 'Connections',
    icon: 'el-icon-user',
    group: 'Agent to Agent',
    priority: 30,
    required_protocols: [
      'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1'
    ]
  }
};

export const shared = {
  data: {
    connections: []
  },
  computed: {
    active_connections: function() {
      return Object.values(this.connections).filter(
        conn => isConnectionActive(conn)
      );
    },
    id_to_connection: function(connection_id) {
      let map = {};
      this.connections.forEach((connection) => {
        map[connection.connection_id] = connection;
      })
      console.log(map);
      return map;
    }
  },
  listeners: {
    "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/connection-list":
    (share, msg) => share.connections = msg.results,
    "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/connection":
    (share, msg) => share.fetch_connections(),
    "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/ack":
    (share, msg) => share.fetch_connections(),
  },
  methods: {
    fetch_connections: ({send}) => {
      send({
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/connection-get-list",
      });
    }
  }
};

export default {
  name: 'connections',
  components: {
    ConnectionList
  },
  mixins: [
    message_bus(),
    share({
      use: ['connections', 'active_connections'],
      actions: ['fetch_connections']
    })
  ],
  data: function() {
    return {
      'invitation': '',
      isQrDialogVisible: false,
      isUrlDialogVisible: false,
    }
  },
  created: async function() {
    await this.ready();
    this.fetch_connections();
  },
  computed: {
    pending_connections: function() {
      return Object.values(this.connections).filter(
        conn => isConnectionPending(conn)
      );
    },
    failed_connections: function() {
      return Object.values(this.connections).filter(
        conn => isConnectionFailed(conn)
      );
    }
  },
  methods: {
    update_connection: function(form) {
      let query_msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/update",
        "connection_id": form.connection_id,
        "label": form.label,
        "role": form.role,
      };
      this.send_message(query_msg);
    },
    delete_connection: function(connection) {
      let query_msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/delete",
        "connection_id": connection.connection_id,
      };
      this.send_message(query_msg);
    },
    recieve_invitation: function() {
      let receive_invite_msg = {
        "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-connections/0.1/receive-invitation",
        "invitation": this.invitation,
        "auto_accept": "auto"
      };
      this.send_message(receive_invite_msg);
      this.invitation = "";
      setTimeout(() => {
        return this.fetch_connections();
      }, 4000);
    },
  },
}
</script>
