import { Container } from 'inversify'
import SI from '@/modules/settings/Identifiers'
import ControllerSettingsRepo from '@/modules/settings/repositories/ControllerSettingsRepo'
import { IUseCase } from '@/modules/IUseCase'
import FetchControllerSettings from '@/modules/settings/usecases/FetchControllerSettings'
import SaveControllerSettings from '@/modules/settings/usecases/SaveControllerSettings'

const container: Container = new Container()

container.bind<ControllerSettingsRepo>(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
  .to(ControllerSettingsRepo)
container.bind<IUseCase>(SI.SETTINGS.USE_CASE.FETCH_CONTROLLER_SETTINGS)
  .to(FetchControllerSettings)
container.bind<IUseCase>(SI.SETTINGS.USE_CASE.SAVE_CONTROLLER_SETTINGS)
  .to(SaveControllerSettings)

export default container
