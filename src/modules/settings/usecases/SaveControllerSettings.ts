import { injectable, inject } from 'inversify'
import ControllerSettingsRepo from '@/modules/settings/repositories/ControllerSettingsRepo'
import SI from '@/modules/settings/Identifiers'
import { IUseCase } from '@/modules/IUseCase'
import ControllerSettings from '@/modules/settings/entities/ControllerSettings'

@injectable()
export default class implements IUseCase {
  controllerSettingsRepo: ControllerSettingsRepo

  constructor (
    @inject(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
      controllerSettingsRepo: ControllerSettingsRepo
  ) {
    this.controllerSettingsRepo = controllerSettingsRepo
  }

  call (settings: ControllerSettings) {
    this.controllerSettingsRepo.save(settings)
  }
}
