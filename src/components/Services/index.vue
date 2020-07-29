<template >
  <el-row>
    <new-service title="Create new service" />
  </el-row>
</template>

<script>
import NewService from './NewService.vue';
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
    NewService
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
  },
  methods: {
  }
}
</script>
