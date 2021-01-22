<template>
  <span>
    <q-item-label header>
      Available plugins
    </q-item-label>
    <q-separator spaced />

    <div class="q-pa-md" style="max-width: 350px">
      <q-list bordered separator v-for="(plugin, index) in plugin_list">
        <q-item clickable v-ripple @click="configure(plugin)">
          <q-item-section>{{plugin.pluginName}}</q-item-section>
        </q-item>
      </q-list>
    </div>
  </span>
</template>

<script>
import axios from 'axios';
import { renderForm } from '@/oca.js-vue'
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
      let pluginFormAlternatives = []
      try {
        pluginFormAlternatives = await Promise.all(
          pluginLangBranches.map(async langBranch => ({
            language: langBranch.lang,
            form: (await renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays])).form
          })
        ));
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
