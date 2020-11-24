import axios from 'axios'

export default {
    computed: {
        adminApiUrl(): string {
            // @ts-ignore
            return this.$session.get('acapyApiUrl')
        }
    },
    methods: {
        $_adminApi_addConsent(params: addConsentParams): Promise<object> {
          return addConsent(
            // @ts-ignore
            this.adminApiUrl,
            params
          )
        }
    }
}

type addConsentParams = {
  label: string,
  oca_schema_namespace: string,
  oca_schema_dri: string,
  payload: object
}

function addConsent(apiUrl: string, params: addConsentParams) {
    const body = {
        label: params.label,
        oca_schema: {
            namespace: params.oca_schema_namespace,
            dri: params.oca_schema_dri,
        },
        payload: params.payload
    }
    return axios.post(`${apiUrl}/verifiable-services/consents`, body)
}
