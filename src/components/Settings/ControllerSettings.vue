<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
    </nav>

    <div class="content">
      <el-form label-width="auto">
        <el-form-item label="Acapy admin API URL:">
          <el-input
            style="width: 300px;"
            v-model="acapyApiUrl">
          </el-input>
        </el-form-item>
        <el-form-item label="WebSocket server URL:">
          <el-input
            style="width: 300px;"
            v-model="websocketUrl">
          </el-input>
        </el-form-item>
        <el-form-item label="OCA Repo URL:">
          <el-input
            style="width: 300px;"
            v-model="ocaRepoUrl">
          </el-input>
        </el-form-item>
        <el-form-item label="DataVault URL:">
          <el-input
            style="width: 300px;"
            v-model="localDataVaultUrl">
          </el-input>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'controller-settings',
  props: ['title'],
  data() {
    return {
      acapyApiUrl: this.$session.get('acapyApiUrl'),
      websocketUrl: this.$session.get('websocketUrl'),
      localDataVaultUrl: this.$session.get('localDataVaultUrl'),
      ocaRepoUrl: this.$session.get('ocaRepoUrl')
    }
  },
  watch: {
    acapyApiUrl: function() {
      this.$session.set('acapyApiUrl', this.acapyApiUrl)
    },
    websocketUrl: function() {
      this.$session.set('websocketUrl', this.websocketUrl)
    },
    localDataVaultUrl: function() {
      this.$session.set('localDataVaultUrl', this.localDataVaultUrl)
    },
    ocaRepoUrl: function() {
      this.$session.set('ocaRepoUrl', this.ocaRepoUrl)
    }
  }
}
</script>

<style scoped>
.content {
  padding: 10px 20px;
}
</style>
