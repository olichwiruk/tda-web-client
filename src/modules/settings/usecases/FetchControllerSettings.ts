import { injectable, inject } from 'inversify'
import { UseCase } from '@/modules/UseCase'
import SI from '@/modules/settings/Identifiers'
import { ControllerSettingsRepo } from '@/modules/settings/repositories'

@injectable()
export class FetchControllerSettings implements UseCase {
  controllerSettingsRepo: ControllerSettingsRepo

  constructor (
    @inject(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
      controllerSettingsRepo: ControllerSettingsRepo
  ) {
    this.controllerSettingsRepo = controllerSettingsRepo
  }

  call () {
    return this.controllerSettingsRepo.get()
  }
}
