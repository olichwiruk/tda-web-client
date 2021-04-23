type IConfiguration = {
  apiUrl: string
  clientId: string
  clientSecret: string
  scope: string
}

export class Configuration {
  apiUrl: string
  clientId: string
  clientSecret: string
  scope: string

  constructor (
    { apiUrl, clientId, clientSecret, scope }: IConfiguration
  ) {
    this.apiUrl = apiUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.scope = scope
  }
}

export default class {
  name: string
  active: boolean
  configuration: Configuration

  constructor (name: string, config: IConfiguration) {
    this.name = name
    this.active = false
    this.configuration = new Configuration(config)
  }

  activate () {
    this.active = true
  }

  deactivate () {
    this.active = false
  }
}
