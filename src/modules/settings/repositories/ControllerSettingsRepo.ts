import { injectable } from 'inversify'
import ControllerSettings from '@/modules/settings/entities/ControllerSettings'
import Storage from '@/storage'

@injectable()
export default class {
  save (controllerSettings: ControllerSettings) {
    Storage.set(Storage.Record.AdminApiUrl, controllerSettings.acapyApiUrl)
    Storage.set(Storage.Record.WebsocketUrl, controllerSettings.websocketUrl)
    Storage.set(Storage.Record.OcaRepoUrl, controllerSettings.ocaRepoUrl)
  }

  get (): ControllerSettings {
    const acapyApiUrl = Storage.get(Storage.Record.AdminApiUrl) || ''
    const websocketUrl = Storage.get(Storage.Record.WebsocketUrl) || ''
    const ocaRepoUrl = Storage.get(Storage.Record.OcaRepoUrl) || ''

    return new ControllerSettings({ acapyApiUrl, websocketUrl, ocaRepoUrl })
  }
}
