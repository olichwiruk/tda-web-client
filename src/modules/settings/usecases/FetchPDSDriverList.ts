import { injectable, inject } from 'inversify'
import { UseCase } from '@/modules/UseCase'
import SI from '@/modules/settings/Identifiers'
import {
  ControllerSettingsRepo,
  PDSDriverRepo
} from '@/modules/settings/repositories'
import {
  Identifiers as SI_OCA,
  SaveForms as SaveOCAForms
} from '@/modules/common/oca'

@injectable()
export class FetchPDSDriverList implements UseCase {
  pdsDriverRepo: PDSDriverRepo
  controllerSettingsRepo: ControllerSettingsRepo
  saveOCAForms: SaveOCAForms

  constructor (
    @inject(SI.SETTINGS.REPOSITORY.PDS_DRIVER_REPO)
      pdsDriverRepo: PDSDriverRepo,
    @inject(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
      controllerSettingsRepo: ControllerSettingsRepo,
    @inject(SI_OCA.COMMON.OCA.USE_CASE.SAVE_FORMS)
      saveOCAForms: SaveOCAForms
  ) {
    this.pdsDriverRepo = pdsDriverRepo
    this.controllerSettingsRepo = controllerSettingsRepo
    this.saveOCAForms = saveOCAForms
  }

  async call () {
    const apiUrl = this.controllerSettingsRepo.get().acapyApiUrl
    const driverList = await this.pdsDriverRepo.all({ apiUrl })
    this.saveOCAForms.call({ driList: driverList.map(d => d.ocaSchemaDri) })

    return driverList
  }
}
