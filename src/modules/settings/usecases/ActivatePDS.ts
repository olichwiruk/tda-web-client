import { injectable, inject } from 'inversify'
import PDSRepo from '@/modules/settings/repositories/PDSRepo'
import ControllerSettingsRepo from '@/modules/settings/repositories/ControllerSettingsRepo'
import PDS from '@/modules/settings/entities/PDS'
import SI from '@/modules/settings/Identifiers'
import { IUseCase } from '@/modules/IUseCase'

@injectable()
export default class implements IUseCase {
  pdsRepo: PDSRepo
  controllerSettingsRepo: ControllerSettingsRepo

  constructor (
    @inject(SI.SETTINGS.REPOSITORY.PDS_REPO) pdsRepo: PDSRepo,
    @inject(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
      controllerSettingsRepo: ControllerSettingsRepo
  ) {
    this.pdsRepo = pdsRepo
    this.controllerSettingsRepo = controllerSettingsRepo
  }

  call (pds: PDS) {
    const apiUrl = this.controllerSettingsRepo.get().acapyApiUrl
    pds.activate()
    this.pdsRepo.save({ apiUrl, pds })
  }
}
