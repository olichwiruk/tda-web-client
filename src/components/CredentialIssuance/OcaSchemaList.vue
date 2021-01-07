<template >
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">{{ title }}</a>
      <vue-bootstrap-typeahead
        v-model="ocaSchemaQuery"
        :minMatchingChars="0"
        :data="ocaSchemaSearch || []"
        :serializer="s => s.schemaName"
        @hit="getOcaSchema"
        style="width: 400px;">
        <template slot="append">
          <el-button
          slot="append"
          class="btn-sm"
          icon="el-icon-search"
          v-show="ocaForm && ocaSchemaQuery"
          @click="preview()">Preview</el-button>
        </template>

        <template slot="suggestion" slot-scope="{ data, htmlText }">
          <small>{{ data.namespace }}/</small><span v-html="htmlText"></span>
        </template>
      </vue-bootstrap-typeahead>
      <el-button
        type="primary"
        icon="el-icon-plus"
        v-show="ocaForm && ocaSchemaQuery"
        @click="issueFormActive = true">Issue</el-button>
    </nav>

    <el-dialog title="Issue Credential" :visible.sync="issueFormActive" @close="deActivateForm()">
      <el-form :model="issueForm">
        <el-form-item label="Connection:" :label-width="formLabelWidth">
          <el-select
            v-model="issueForm.connection_id"
            filterable
            value-key="issueForm.connection_id"
            placeholder="Select">
            <el-option
              v-for="connection in available_connections"
              :key="connection.connection_id"
              :label="connection.their_label"
              :value="connection.connection_id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="Comment (optional)"
          :label-width="formLabelWidth">
          <el-input
            v-model="issueForm.comment"
            type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deActivateForm()">Cancel</el-button>
        <el-button :disabled="!issueForm.connection_id" type="primary" @click="fillOcaForm">Next</el-button>
      </span>
    </el-dialog>

    <el-dialog title="Issue Credential" :modalAppendToBody="false" :visible.sync="ocaFormSaved" @close="deActivateForm()">
      <el-form>
        <el-form-item label="For:" :label-width="formLabelWidth">
          {{ issueData.connection_label }}
        </el-form-item>
        <el-form-item
          label="Comment (optional)"
          v-if="issueData.comment"
          :label-width="formLabelWidth">
          {{ issueData.comment }}
        </el-form-item>
        <el-form-item
          label="OCA Schema:"
          :label-width="formLabelWidth">
          {{ issueData.schema_name }}
          <el-button class='btn-sm' @click="preview(issueData.formInput)">Preview</el-button>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deActivateForm()">Cancel</el-button>
        <el-button :disabled="!issueData.connection_id" :loading="sendingCred" type="primary" @click="issueCredential">Send</el-button>
      </span>
    </el-dialog>

    <preview-component style="z-index: 9999;" ref="PreviewComponent" :readonly="true" :form="ocaForm" :alternatives="ocaFormAlternatives"></preview-component>
    <preview-component ref="OcaFormComponent" :form="ocaForm" :alternatives="ocaFormAlternatives"></preview-component>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
import axios from 'axios'

import { generateDri } from '@/dri_generator'
import message_bus from '../../message_bus.ts';
import share from '../../share.ts';

import { eventBus as ocaEventBus, EventHandlerConstant,
  renderForm, PreviewComponent } from 'oca.js-vue'

export default {
  name: 'oca-schema-list',
  props: ['title', 'connections'],
  components: {
    VueJsonPretty,
    VueBootstrapTypeahead,
    PreviewComponent
  },
  mixins: [
    message_bus({
      events: {
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-credential-definitions/0.1/credential-definition-id":
        (v, msg) => {
          v.$emit('issue-cred', {
            connection_id: v.issueData.connection_id,
            cred_def_id: msg.cred_def_id,
            comment: v.issueData.comment,
            attributes: [{
              name: 'hashlink',
              value: v.issueData.dri
            }]
          })
        },
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-schemas/0.1/schema-id":
        (v, msg) => {
          v.send_message({
            "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-credential-definitions/0.1/send-credential-definition",
            "schema_id": msg.schema_id.split(",")[0].slice(2, -1)
          });
        },
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-issuer/0.1/credential-exchange":
        (v, msg) => {
          v.$noty.success("Credential issued successfully!", { timeout: 1000 })
          v.sendingCred = false
          v.deActivateForm()
        },
        "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/notification/1.0/problem-report":
        (v, msg) => {
          v.$noty.error(msg.explain-ltxt, { timeout: 1000 })
          v.sendingCred = false
          v.deActivateForm()
        },
      },
    }),
    share({
      use: [
        'schemas',
      ]
    })
  ],
  data () {
    return {
      issueFormActive: false,
      issueForm: {
        connection_id: '',
        connection_label: '',
        comment: ''
      },
      issueData: {
        fileserver: '',
        ocaRepo: {
          host: ''
        }
      },
      formLabelWidth: '200px',
      ocaSchemaQuery: '',
      ocaSchemaSearch: [],
      ocaSchema: null,
      ocaForm: null,
      ocaFormAlternatives: [],
      ocaFormSaved: false,
      sendingCred: false
    }
  },
  watch: {
    ocaSchemaQuery: function(input) {
      if(input.length == 0) {
        this.ocaSchema = null
      }
      this.fetchOcaSchemas(input)
    },
    'issueForm.connection_id': function(connection_id) {
      const selectedConnection = this.available_connections.find(c => {
        return c.connection_id == connection_id
      })
      if(selectedConnection) {
        this.issueForm.connection_label = selectedConnection.their_label
      }
    },
  },
  computed: {
    available_connections: function() {
      return this.connections.filter(c => c.their_label != 'ToolBox')
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
    fileserverUrl: function() {
      return this.$session.get('localDataVaultUrl')
    }
  },
  mounted() {
    this.issueData.fileserver = this.fileserverUrl
    this.issueData.ocaRepo.host = this.ocaRepoUrl
    this.ocaSchemaSearch = this.fetchOcaSchemas('')

    ocaEventBus.$off(EventHandlerConstant.SAVE_PREVIEW)
    ocaEventBus.$on(EventHandlerConstant.SAVE_PREVIEW, this.savePreviewHandler)
  },
  methods: {
    deActivateForm: function() {
      this.issueFormActive = false
      this.ocaFormSaved = false
      this.issueForm = {
        connection_id: '',
        connection_label: '',
        comment: ''
      };
    },
    fillOcaForm: function() {
      this.issueData = { ...this.issueData, ...this.issueForm }
      this.issueData.schema_name = this.ocaForm.label
      this.issueFormActive = false

      try {
          this.$refs.OcaFormComponent.openModal({
            ...this.ocaForm,
            label: `${this.ocaForm.label} for ${this.issueData.connection_label}`
          });
      } catch {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    issueCredential: function() {
      this.sendingCred = true
      this.generateDriForCredential()

      const schema = this.schemas.find(s => {
        return s.attributes.length == 1 && s.attributes[0] == 'hashlink' && s.author == 'self'
      })
      if(schema){
        this.send_message({
          "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/admin-credential-definitions/0.1/send-credential-definition",
          "schema_id": schema.schema_id,
        });
      } else {
        this.$emit('publish-schema', {
          name: 'ocaSchema', version: '1.0', attributes: ['hashlink']
        })
      }
    },
    generateDriForCredential: async function() {
      const buffer = Buffer.from(
        JSON.stringify(this.issueData.formInput, null, 2)
      )

      const urls = [`${this.issueData.fileserver}/api/v1/files/${this.issueData.formInputDri}`]
      const meta = {
        experimental: {
          host: `${this.issueData.ocaRepo.host}/api/v2/schemas/${this.issueData.ocaRepo.namespace}/`,
          dri: this.issueData.ocaRepo.branchDri
        }
      }

      this.issueData.dri = await generateDri(buffer, urls, meta)
    },
    fetchOcaSchemas: function(input) {
        axios.get(`${this.issueData.ocaRepo.host}/api/v2/schemas?suggest=${input}`)
        .then(r => {
          this.ocaSchemaSearch = r.data.map(x => {
            return {
              namespace: x.namespace,
              DRI: x.DRI,
              schemaName: x.schema.name
            }
          })
        })
    },
    getOcaSchema: async function(schema) {
      this.ocaFormAlternatives = []
      const result = await axios.get(`${this.issueData.ocaRepo.host}/api/v2/schemas?_index=branch&schema_base=${schema.DRI}`)
      const branchesBase = result.data.filter(e => e.namespace == schema.namespace)
      const branchBase = branchesBase[0]
      const branchResponse = await axios.get(`${this.issueData.ocaRepo.host}/api/v2/schemas/${branchBase.namespace}/${branchBase.DRI}`)
      const branch = branchResponse.data
      const langBranches = this.splitBranchPerLang(branch)

      try {
          langBranches.forEach(langBranch => {
            this.ocaFormAlternatives.push({
              language: langBranch.lang,
              form: renderForm([langBranch.branch.schema_base, ...langBranch.branch.overlays]).form
            })
          })

          this.ocaForm = this.ocaFormAlternatives[0].form
          this.issueData.ocaRepo.namespace = schema.namespace
          this.issueData.ocaRepo.branchDri = branchesBase[0].DRI
      } catch {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    splitBranchPerLang: function(branch) {
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
    preview(formInput = null) {
      try {
          this.$refs.PreviewComponent.openModal(this.ocaForm, formInput);
      } catch(e) {
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    async savePreviewHandler(data) {
      this.issueData.formInput = data
      const dataStr = JSON.stringify(data, null, 2)
      const buffer = Buffer.from(dataStr)
      const dri = await generateDri(buffer)
      const blob = new Blob([dataStr], {type: 'application/json'})

      const formData = new FormData()
      formData.append("file", blob, `${dri.split(':')[1]}.json`)
      axios.post(`${this.issueData.fileserver}/api/v1/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(r => {
        this.issueData.formInputDri = r.data
      })

      this.$refs.OcaFormComponent.closeModal();
      this.ocaFormSaved = true
    }
  }
}
</script>
