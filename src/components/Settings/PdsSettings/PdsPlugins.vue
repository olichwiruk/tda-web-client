<template>
  <div>
    Plugins:<br>
    <el-collapse v-model="expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="(plugin, index) in plugin_list"
          :title="plugin.pluginName"
          :name="plugin.pluginName + index"
          :key="index">
          <el-row>
            <vue-json-pretty :deep=0 :data="plugin" />
            <el-button size="medium" :disabled="!plugin.oca_schema_namespace || !plugin.oca_schema_dri"
              @click="configure(plugin)">Configure</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
  </div>
</template>

<script>
import axios from 'axios';
import { renderForm } from 'oca.js-vue'
import VueJsonPretty from 'vue-json-pretty';

export default {
  name: 'pds-plugins',
  components: {
    VueJsonPretty
  },
  data() {
    return {
      expanded_items: [],
      plugin_list: []
    }
  },
  computed: {
    acapyApiUrl: function() {
      return this.$session.get('acapyApiUrl')
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    }
  },
  methods: {
    async renderPluginForm(plugin) {
      const pluginBranch = (await axios.get(
        `${this.ocaRepoUrl}/api/v2/schemas/${plugin.oca_schema_namespace}/${plugin.oca_schema_dri}`
      )).data

      const pluginLangBranches = this.splitBranchPerLang(pluginBranch)
      let pluginForm
      const pluginFormAlternatives = []
      try {
        pluginLangBranches.forEach(langBranch => {
          pluginFormAlternatives.push({
            language: langBranch.lang,
            form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays]).form
          })
        })
        pluginForm = pluginFormAlternatives[0].form
      } catch(e) {
        console.log(e)
        this.$noty.error("ERROR! Consent form data are corrupted.", {
          timeout: 1000
        })
      }

      return {
        form: pluginForm,
        formAlternatives: pluginFormAlternatives
      }
    },
    splitBranchPerLang(branch) {
      const langBranches = []
      const labelOverlays = branch.overlays.filter(o => o.type.includes("label"))
      const languages = labelOverlays.map(o => o.language)
      const schemaBase = branch.schema_base
      languages.forEach(lang => {
        langBranches.push({
          lang: lang,
          branch: {
            schema_base: schemaBase,
            overlays: branch.overlays.filter(o => {
              if(!o.language) { return true }
              return o.language == lang
            })
          }
        })
      })
      return langBranches
    },
    async configure(plugin) {
      this.$emit('configure-plugin', {
        pluginName: plugin.pluginName,
        plugin: await this.renderPluginForm(plugin)
      })
    }
  },
  mounted() {
    axios.get(`${this.acapyApiUrl}/pds`)
      .then(r => {
        if (r.status === 200) {
          const entries = Object.entries(r.data.types)
          this.plugin_list = entries.map(entry => {
            return {
              pluginName: entry[0],
              oca_schema_namespace: entry[1].oca_schema_namespace,
              oca_schema_dri: entry[1].oca_schema_dri
            }
          })
        }
      }).catch(e => {
        console.log(e)
        this.$noty.error("Error occurred", { timeout: 1000 })
      })
  }
}
</script>
