<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>

      <el-button type="primary" icon="el-icon-refresh"
        @click="$emit('services-refresh')"></el-button>
    </nav>

    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="(service, index) in services"
          :title="service.label"
          :name="service.label + index"
          :key="index">
          <el-row>
            <vue-json-pretty :deep=1 :data="service" />
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';

export default {
  name: 'service-list',
  props: [
    'title',
    'services'
  ],
  components: {
    VueJsonPretty
  },
  data () {
    return {
      expanded_items:[],
    }
  },
  methods: {
  },
}
</script>
