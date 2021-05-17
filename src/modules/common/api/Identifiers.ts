const SERVICE_IDENTIFIER = {
  COMMON: {
    API: {
      HTTP_CLIENT: Symbol('common.api.http_client').toString(),
      APPLICATIONS: Symbol('common.api.applications').toString(),
      CONNECTIONS: Symbol('common.api.connections').toString(),
      CONSENTS: Symbol('common.api.consents').toString(),
      DOCUMENTS: Symbol('common.api.documents').toString(),
      PDS: Symbol('common.api.pds').toString(),
      PRESENTATION_REQUESTS: Symbol('common.api.presentation_request').toString(),
      PRESENTATIONS: Symbol('common.api.presentations').toString(),
      SERVICES: Symbol('common.api.services').toString()
    }
  }
}

export default SERVICE_IDENTIFIER
