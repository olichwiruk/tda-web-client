type IControllerSettings = {
  acapyApiUrl: string
  websocketUrl: string
  ocaRepoUrl: string
}

export class ControllerSettings {
  acapyApiUrl: string
  websocketUrl: string
  ocaRepoUrl: string

  constructor (
    { acapyApiUrl, websocketUrl, ocaRepoUrl }: IControllerSettings
  ) {
    this.acapyApiUrl = acapyApiUrl
    this.websocketUrl = websocketUrl
    this.ocaRepoUrl = ocaRepoUrl
  }
}
