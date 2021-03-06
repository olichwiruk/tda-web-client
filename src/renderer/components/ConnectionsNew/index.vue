<template>
  <el-row>
    <connection-list
      title="Active Connections:"
      editable="true"
      :list="active_connections_new"
      @connection-editted="update_connection"
      @connection-deleted="delete_connection"
      @refresh="fetch_connections_new"></connection-list>
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

    <p>Add connection from invitation:</p>
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
  </el-row>
</template>

<script>
import ConnectionList from './ConnectionList.vue';
import share from '@/share.ts';
import message_bus from '@/message_bus.ts';

export const protocol = 'https://github.com/hyperledger/aries-toolbox/tree/master/docs/admin-connections/0.1';
export const metadata = {
  menu: {
    label: 'Connections [New]',
    icon: 'el-icon-user',
    group: 'Agent to Agent',
    priority: 30,
    required_protocols: [
      protocol
    ]
  },
  types: {
    connection: protocol + '/connection',
    get_list: protocol + '/get-list',
    list: protocol + '/list',
    update: protocol + '/update',
    delete: protocol + '/delete',
    deleted: protocol + '/deleted',
    receive_invitation: protocol + '/receive-invitation'
  }
};

export const shared = {
  data: {
    connections_new: []
  },
  computed: {
    active_connections_new: function() {
        return Object.values(this.connections_new).filter(
          conn => {
            if (!("state" in conn)) {
              return false;
            }
            return conn.state === "active"
          }
        );
    },
    id_to_connection_new: function(connection_id) {
      let map = {};
      this.connections_new.forEach((connection) => {
        map[connection.connection_id] = connection;
      })
      return map;
    }
  },
  listeners: {
    [metadata.types.list]:
    (share, msg) => share.connections_new = msg.connections,
    [metadata.types.connection]:
    (share, msg) => share.fetch_connections_new(),
    [metadata.types.deleted]:
    (share, msg) => share.fetch_connections_new(),
  },
  methods: {
    fetch_connections_new: ({send}) => {
      send({
        "@type": metadata.types.get_list,
      });
    }
  }
};

export default {
  name: 'connections-new',
  components: {
    ConnectionList
  },
  mixins: [
    message_bus(),
    share({
      use: ['connections_new', 'active_connections_new'],
      actions: ['fetch_connections_new']
    })
  ],
  data: function() {
    return {
      'invitation': '',
    }
  },
  created: async function() {
    await this.ready();
    this.fetch_connections_new();
  },
  computed: {
    pending_connections: function() {
      return Object.values(this.connections_new).filter(
        conn => "state" in conn && conn.state == 'pending'
      );
    },
    failed_connections: function() {
      return Object.values(this.connections_new).filter(
        conn => "state" in conn && conn.state === "error"
      );
    }
  },
  methods: {
    update_connection: function(form) {
      let query_msg = {
        "@type": metadata.types.update,
        "connection_id": form.connection_id,
        "label": form.label,
        "role": form.role,
      };
      this.send_message(query_msg);
    },
    delete_connection: function(connection) {
      let query_msg = {
        "@type": metadata.types.delete,
        "connection_id": connection.connection_id,
      };
      this.send_message(query_msg);
    },
    recieve_invitation: function() {
      let receive_invite_msg = {
        "@type": metadata.types.receive_invitation,
        "invitation": this.invitation,
        "auto_accept": true
      };
      this.send_message(receive_invite_msg);
      this.invitation = "";
      setTimeout(() => {
        return this.fetch_connections_new();
      }, 4000);
    },
  },
}
</script>
