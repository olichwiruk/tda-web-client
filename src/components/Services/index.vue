<template>
  <el-row>
    <new-service title="Create new service"
      @services-refresh="refreshServices" />
    <service-list title="My services" :services="myServicesSorted"
      @services-refresh="refreshServices" />
  </el-row>
</template>

<script>
import axios from 'axios';

import NewService from './NewService.vue';
import ServiceList from './ServiceList.vue';
import message_bus from '@/message_bus.js';
import share from '@/share.js';

export const metadata = {
  menu: {
    label: 'Services',
    icon: 'el-icon-goods',
    group: 'Agent to Agent',
    priority: 110,
    required_protocols: []
  }
};

export const shared = {
  data: {},
  listeners: {}
}

export default {
  name: 'services',
  components: {
    NewService,
    ServiceList
  },
  data() {
    return {
      myServices: []
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    myServicesSorted: function() {
      return this.myServices.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }
  },
  mixins: [
    message_bus(),
    share({
      use: [],
      actions: []
    })
  ],
  created: async function() {
    await this.ready();
    this.refreshServices()
  },
  methods: {
    refreshServices() {
      axios.get(`${this.acapyApiUrl}/service-discovery/get-list-self`)
        .then(r => {
          if (r.status === 200) {
            this.myServices = r.data
          }
        }).catch(e => {
          console.log(e)
          this.$noty.error("Error occuerrd", { timeout: 1000 })
        })
    }
  }
}
</script>
