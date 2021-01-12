<template >
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> {{ title }} </a>
      <el-button
        type="primary"
        icon="el-icon-refresh"
        @click="$emit('presentation-refresh',)"></el-button>
    </nav>
    <el-collapse v-model="ver_pres_expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="presentation in VerifiedPresentations"
          :title="presentationTitle(presentation, 'From')"
          :name="presentation.presentation_exchange_id"
          :key="presentation.presentation_exchange_id">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="presentation">
              </vue-json-pretty>
            </div>
            <el-button @click="preview_presentation(presentation)">Preview</el-button>
            <el-button v-on:click="collapse_expanded_ver_pres(presentation)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> Received Requests </a>
    </nav>
    <el-collapse v-model="rec_req_expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="presentation in ReceivedRequests"
          :title="presentationTitle(presentation, 'From')"
          :name="presentation.presentation_exchange_id"
          :key="presentation.presentation_exchange_id">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="presentation">
              </vue-json-pretty>
            </div>
            <el-button @click="preview_presentation(presentation)">Preview</el-button>
            <el-button type="success" plain @click="activate_presentation_dialog(presentation)">Present</el-button>
            <el-button v-on:click="collapse_expanded_rec_req(presentation)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> Sent Presentations </a>
    </nav>
    <el-collapse v-model="sent_pres_expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="presentation in SentPresentations"
          :title="presentationTitle(presentation, 'To')"
          :name="presentation.presentation_exchange_id"
          :key="presentation.presentation_exchange_id">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="presentation">
              </vue-json-pretty>
            </div>
            <el-button @click="preview_presentation(presentation)">Preview</el-button>
            <el-button v-on:click="collapse_expanded_sent_pres(presentation)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#"> Sent Requests </a>
    </nav>
    <el-collapse v-model="sent_prop_expanded_items">
      <ul class="list">
        <el-collapse-item
          v-for="presentation in SentRequest"
          :title="presentationTitle(presentation, 'To')"
          :name="presentation.presentation_exchange_id"
          :key="presentation.presentation_exchange_id">
          <el-row>
            <div>
              <vue-json-pretty
                :deep=0
                :data="presentation">
              </vue-json-pretty>
            </div>
            <el-button @click="preview_presentation(presentation)">Preview</el-button>
            <el-button v-on:click="collapse_expanded_sent_prop(presentation)">^</el-button>
          </el-row>
        </el-collapse-item>
      </ul>
    </el-collapse>

    <el-dialog title="Present document" :visible.sync="presentationDialog.active" @close="deactivatePresentationDialog()">
      <el-form>
        <el-form-item
          label="Documents:"
          :label-width="formLabelWidth">
          <el-select v-model="presentationDialog.selectedCredential" placeholder="Select document">
            <el-option
              v-for="(item, i) in presentationDialog.matchingCredentials"
              :key="item.id"
              :label="item.credential.issuanceDate"
              :value="i">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="deactivatePresentationDialog()">Cancel</el-button>
        <el-button :disabled="!(presentationDialog.selectedCredential >= 0)" type="primary" @click="send_presentation(presentationDialog)">Send</el-button>
      </span>
    </el-dialog>

    <preview-component ref="PreviewComponent" :readonly="true" :form="form" :alternatives="alternatives"></preview-component>
  </div>
</template>

<script>
import axios from 'axios';
import VueJsonPretty from 'vue-json-pretty';
import adminApi from '@/admin_api.ts'
import { mapState, mapActions } from 'vuex'
import { renderForm, PreviewComponent } from 'oca.js-vue'

export default {
  name: 'presentation',
  props: [
    'title',
    'presentations',
    'credentials',
    'connections',
  ],
  components: {
    VueJsonPretty,
    PreviewComponent
  },
  data () {
    return {
      ver_pres_expanded_items:[],
      sent_prop_expanded_items:[],
      rec_req_expanded_items:[],
      sent_pres_expanded_items:[],
      expanded_items:[],
      formLabelWidth: '100px',
      credentialsLabel: {},
      credentialsSchema: {},
      credentialsSchemaAlt: {},
      schemaInput: {},
      schemaPayload: {},
      form: {},
      alternatives: [],
      presentationDialog: {
        active: false,
        exchangeId: null,
        matchingCredentials: [],
        selectedCredential: null
      }
    }
  },
  mixins: [adminApi],
  methods: {
    ...mapActions('WsMessages', ['delete_message']),
    deactivatePresentationDialog() {
      this.presentationDialog = {
        active: false,
        exchangeId: null,
        matchingCredentials: [],
        selectedCredential: null
      }
    },
    collapse_expanded_ver_pres: function(presentation){
      this.ver_pres_expanded_items = this.ver_pres_expanded_items.filter(
        item => item != presentation.presentation_exchange_id
      );
    },
    collapse_expanded_sent_prop: function(presentation){
      this.sent_prop_expanded_items = this.sent_prop_expanded_items.filter(
        item => item != presentation.presentation_exchange_id
      );
    },
    collapse_expanded_rec_req: function(presentation){
      this.rec_req_expanded_items = this.rec_req_expanded_items.filter(
        item => item != presentation.presentation_exchange_id
      );
    },
    collapse_expanded_sent_pres: function(presentation){
      this.sent_pres_expanded_items = this.sent_pres_expanded_items.filter(
        item => item != presentation.presentation_exchange_id
      );
    },
    presentationTitle(presentation, dir) {
      let title = ''
      const label = this.credentialsLabel[presentation.presentation_exchange_id]
      const connection = this.connection_map[presentation.connection_id]

      if (label) { title += label + ' | ' }
      title += presentation.created_at + ' | '
      if (dir && connection) { title +=  `${dir}: ${connection.their_label}` }
      return title
    },
    activate_presentation_dialog(presentation) {
      this.presentationDialog.matchingCredentials = this.credentials.filter(cred => {
        return cred.credential.credentialSubject.oca_schema_dri == presentation.presentation_request.schema_base_dri
      }).sort((a, b) => {
        if(a.credential.issuanceDate > b.credential.issuanceDate) {
          return -1
        } else if(b.credential.issuanceDate > a.credential.issuanceDate) {
          return 1
        }
        return 0
      })
      if (this.presentationDialog.matchingCredentials.length > 0) {
        this.presentationDialog.selectedCredential = 0
        this.presentationDialog.exchangeId = presentation.presentation_exchange_id
        this.presentationDialog.active = true
      } else {
        this.$noty.error("You dont have matching credential.", {
          timeout: 1000
        })
      }
    },
    send_presentation(presentationData) {
      this.deactivatePresentationDialog()
      this.$_adminApi_sendPresentation({
        credential_id: presentationData.matchingCredentials[presentationData.selectedCredential].id,
        exchange_record_id: presentationData.exchangeId
      }).then(r => {
        this.$emit('presentation-refresh',)
      })
      this.$noty.success("Presentation send!", {
        timeout: 1000
      })
    },
    async preview_presentation(presentation) {
      const presExId = presentation.presentation_exchange_id

      this.alternatives = this.credentialsSchemaAlt[presExId]

      this.$refs.PreviewComponent.openModal({ label: 'Loading...', sections: [] });
      let input = null
      if (this.schemaInput[presExId]) {
        input = this.schemaPayload[this.schemaInput[presExId]]
      }
      try {
          this.form = this.credentialsSchema[presExId]
          this.$refs.PreviewComponent.openModal(this.form, input);
      } catch(e) {
          console.log(e)
          this.$refs.PreviewComponent.closeModal()
          this.$noty.error("ERROR! Form data are corrupted.", {
            timeout: 1000
          })
      }
    },
    generatePreview: async function(presentationEl) {
      const presExId = presentationEl.presentation_exchange_id
      const presentation = presentationEl.presentation
      if(presentation) {
        const credential = Object.values(presentation.verifiableCredential)[0]
        const serviceSchema = {
          oca_schema_namespace: credential.credentialSubject.oca_schema_namespace,
          oca_schema_dri: credential.credentialSubject.oca_schema_dri
        }
        axios.get(`${this.ocaRepoUrl}/api/v2/schemas/${serviceSchema.oca_schema_namespace}/${serviceSchema.oca_schema_dri}`)
          .then(r => {
            const branch = r.data
            this.credentialsSchemaAlt[presExId] = []
            const langBranches = this.splitBranchPerLang(branch)

            langBranches.forEach(langBranch => {
              this.credentialsSchemaAlt[presExId].push({
                language: langBranch.lang,
                form: renderForm([
                  langBranch.branch.schema_base,
                  ...langBranch.branch.overlays]
                ).form
              })
            })
            this.credentialsSchema[presExId]= this.credentialsSchemaAlt[presExId][0].form
            this.credentialsLabel[presExId] = this.credentialsSchema[presExId].label
          })

        if(credential.credentialSubject.oca_data_dri) {
          this.schemaInput[presExId] = credential.credentialSubject.oca_data_dri
          if (!this.schemaPayload[credential.credentialSubject.oca_data_dri]) {
            this.$_adminApi_askForPayload({
              connection_id: presentationEl.connection_id,
              payload_id: credential.credentialSubject.oca_data_dri
            })
          }
        }
      } else {
        axios.get(`${this.ocaRepoUrl}/api/v3/schemas/${presentationEl.presentation_request.schema_base_dri}`)
          .then(r => {
            const branch = r.data
            this.credentialsSchemaAlt[presExId] = []
            const langBranches = this.splitBranchPerLang(branch)

            langBranches.forEach(langBranch => {
              this.credentialsSchemaAlt[presExId].push({
                language: langBranch.lang,
                form: renderForm([
                  langBranch.branch.schema_base,
                  ...langBranch.branch.overlays]
                ).form
              })
            })
            this.credentialsSchema[presExId]= this.credentialsSchemaAlt[presExId][0].form
            this.credentialsLabel[presExId] = this.credentialsSchema[presExId].label
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
  },
  watch: {
    pdsPayloadMessages: {
      handler: function() {
        this.pdsPayloadMessages.forEach(msg => {
          const payload = JSON.parse(msg.content.payload)
          this.schemaPayload[msg.content.dri] = Object.values(payload)[0].p
          this.delete_message(msg.uuid)
        })
      }
    },
    presentProofMessages: {
      handler: function() {
        this.presentProofMessages.forEach(msg => {
          this.$emit('presentation-refresh',)
          this.delete_message(msg.uuid)
        })
      }
    },
    presentations: function() {
      this.presentations.forEach(async (presentation) => {
        await this.generatePreview(presentation)
      })
      if (this.presentations.length != Object.keys(this.credentialsLabel).length) {
        this.$emit('presentation-refresh',)
      }
    }
  },
  computed: {
    ...mapState('WsMessages', ['messages']),
    pdsPayloadMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/pds/payload/'
      })
    },
    presentProofMessages: function() {
      return this.messages.filter(message => {
        return message.topic == '/topic/present_proof/'
      })
    },
    connection_map: function() {
      let map =  this.connections.reduce((acc, item) => {
        acc[item.connection_id] = item;
        return acc;
      }, {});
      return map;
    },
    completed_verifications: function() {
      return this.presentations.filter(pres_exch => pres_exch.state === 'verified');
    },
    VerifiedPresentations() {
      console.log('PRESENTATIONS', this.presentations);
      return this.presentations.filter(
        exchange =>
        (
          "state" in exchange &&
          (
            exchange.state === "verified" ||
            exchange.state === "presentation_acked" ||
            exchange.state === "presentation_received"
          )
        ) &&
        //==========================================
        "role" in exchange &&
        "verifier" === exchange.role )
    },
    ReceivedRequests(){
      return this.presentations.filter(
        exchange =>
        "state" in exchange &&
        exchange.state === "request_received" &&
        //==========================================
        "role" in exchange &&
        "prover" === exchange.role)
    },
    SentPresentations(){
      return this.presentations.filter(
        exchange =>
        "state" in exchange &&
        exchange.state === "presentation_sent" &&
        //==========================================
        "role" in exchange &&
        "prover" === exchange.role )
    },
    SentRequest(){
      return this.presentations.filter(
        exchange =>
        "state" in exchange &&
        exchange.state === "request_sent"  &&
        //==========================================
        "role" in exchange &&
        "verifier" === exchange.role
      )
    },
    ocaRepoUrl: function() {
      return this.$session.get('ocaRepoUrl')
    },
  }
}
</script>
