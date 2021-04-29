import { injectable, inject } from 'inversify'
import { UseCase } from '@/modules/UseCase'
import SI from '@/modules/settings/Identifiers'
import { PDS } from '@/modules/settings/entities'
import {
  ControllerSettingsRepo,
  PDSRepo
} from '@/modules/settings/repositories'

@injectable()
export class ActivatePDS implements UseCase {
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
