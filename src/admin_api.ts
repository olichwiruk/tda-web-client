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
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return addConsent(apiUrl, params)
        },
        $_adminApi_getConsents(): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getConsents(apiUrl)
        },
        $_adminApi_getGivenConsents(): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getGivenConsents(apiUrl)
        },
        $_adminApi_getCredentials(): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getCredentials(apiUrl)
        },
        $_adminApi_addService(params: addServiceParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return addService(apiUrl, params)
        },
        $_adminApi_applyOnService(params: applyOnServiceParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return applyOnService(apiUrl, params)
        },
        $_adminApi_getServiceApplications(params: getServiceApplicationsParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getServiceApplications(apiUrl, params)
        },
        $_adminApi_getPresentations(): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getPresentations(apiUrl)
        },
        $_adminApi_requestPresentation(params: requestPresentationParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return requestPresentation(apiUrl, params)
        },
        $_adminApi_sendPresentation(params: sendPresentationParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return sendPresentation(apiUrl, params)
        },
        $_adminApi_askForPayload(params: askForPayloadParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return askForPayload(apiUrl, params)
        },
        $_adminApi_getPayload(params: getPayloadParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getPayload(apiUrl, params)
        },
        $_adminApi_saveCurrentData(params: saveCurrentDataParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return saveCurrentData(apiUrl, params)
        },
        $_adminApi_getCurrentData(params: getCurrentDataParams): Promise<object> {
          // @ts-ignore
          const apiUrl = this.adminApiUrl
          return getCurrentData(apiUrl, params)
        },
    }
}

/* CONSENTS */

type addConsentParams = {
  label: string,
  oca_schema_namespace: string,
  oca_schema_dri: string,
  data: object
}

function addConsent(apiUrl: string, params: addConsentParams) {
    const body = {
        label: params.label,
        oca_schema_namespace: params.oca_schema_namespace,
        oca_schema_dri: params.oca_schema_dri,
        oca_data: params.data
    }
    return axios.post(`${apiUrl}/verifiable-services/consents`, body)
}

function getConsents(apiUrl: string) {
    return axios.get(`${apiUrl}/verifiable-services/consents`)
}

function getGivenConsents(apiUrl: string) {
    return axios.get(`${apiUrl}/verifiable-services/given-consents`)
}

/* CREDENTIALS */
function getCredentials(apiUrl: string) {
    return axios.get(`${apiUrl}/credentials`)
}

/* SERVICES */

type addServiceParams = {
    label: string,
    consent_id: string,
    service_schema: {
        oca_schema_namespace: string,
        oca_schema_dri: string
    }
}

function addService(apiUrl: string, params: addServiceParams) {
    return axios.post(`${apiUrl}/verifiable-services/add`, params)
}

type applyOnServiceParams = {
    connection_id: string,
    service: {
        label: string,
        service_id: string,
        consent_schema: {
            oca_schema_namespace: string,
            oca_schema_dri: string,
            data_dri: string,
            data: string
        },
        service_schema: {
            oca_schema_namespace: string,
            oca_schema_dri: string
        }
    },
    user_data: string
}

function applyOnService(apiUrl: string, params: applyOnServiceParams) {
    return axios.post(`${apiUrl}/verifiable-services/apply`, params)
}

type getServiceApplicationsParams = {
    state?: string,
    author?: string
}

function getServiceApplications(apiUrl: string, params: getServiceApplicationsParams) {
    return axios.post(`${apiUrl}/verifiable-services/get-issue`, params)
}

/* PRESENTATIONS */

function getPresentations(apiUrl: string) {
    return axios.get(`${apiUrl}/present-proof/exchange/record`)
}

type requestPresentationParams = {
    connection_id: string,
    oca_schema_dri: string
}

function requestPresentation(apiUrl: string, params: requestPresentationParams) {
    return axios.post(`${apiUrl}/present-proof/request`, {
      connection_id: params.connection_id,
      schema_base_dri: params.oca_schema_dri,
      requested_attributes: []
    })
}

type sendPresentationParams = {
    credential_id: string,
    exchange_record_id: string
}

function sendPresentation(apiUrl: string, params: sendPresentationParams) {
    return axios.post(`${apiUrl}/present-proof/present`, params)
}


/* PDS */

type askForPayloadParams = {
    connection_id: string,
    payload_id: string
}

function askForPayload(apiUrl: string, params: askForPayloadParams) {
  return axios.post(`${apiUrl}/pds/get_from?connection_id=${params.connection_id}&payload_id=${params.payload_id}`)
}

type getPayloadParams = {
    payload_dri: string
}

function getPayload(apiUrl: string, params: getPayloadParams) {
  return axios.get(`${apiUrl}/pds/${params.payload_dri}`)
}

type saveCurrentDataParams = {
    data: object
}

function saveCurrentData(apiUrl: string, params: saveCurrentDataParams) {
  return axios.post(`${apiUrl}/pds/current/`, params)
}

type getCurrentDataParams = {
    schemaDris: string[]
}

function getCurrentData(apiUrl: string, params: getCurrentDataParams) {
  const queryParams = params.schemaDris
    .map(dri => `oca_schema_base_dris=${dri}`).join('&')
  return axios.get(`${apiUrl}/pds/current/?${queryParams}`)
}
