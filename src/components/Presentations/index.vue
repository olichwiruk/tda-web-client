<template >
  <el-row>
    <presentation title="Received Presentations"
      :credentials="credentials"
      :presentations="presentations"
      :connections="active_connections"
      @presentation-refresh="refresh_presentations"></presentation>
  </el-row>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import Presentation from './Presentation.vue';
import share from '@/share.ts';
import adminApi from '@/admin_api.ts'

export const metadata = {
  menu: {
    label: 'Presentations',
    icon: 'el-icon-document-checked',
    group: 'Agent to Agent',
    priority: 90,
    required_protocols: [
      'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-holder/0.1'
    ]
  }
};

export default {
  name: 'presentations',
  components: {
    VueJsonPretty,
    Presentation,
  },
  data() {
    return {
      presentations: [],
      credentials: []
    }
  },
  mixins: [
    share({
      use: ['active_connections'],
    }),
    adminApi
  ],
  created: async function() {
    await this.ready();
    this.refresh_presentations();
  },
  methods: {
    refresh_presentations() {
      this.$_adminApi_getCredentials()
        .then(r => {
          this.credentials = r.data.result.map(c => {
            return {
              id: c.dri,
              credential: JSON.parse(c.content)
            }
          })
        })
      this.$_adminApi_getPresentations()
        .then(r => this.presentations = r.data)
    }
  }
}
</script>
