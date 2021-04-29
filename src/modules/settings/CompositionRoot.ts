import { Container } from 'inversify'
import SI from '@/modules/settings/Identifiers'
import ControllerSettingsRepo from '@/modules/settings/repositories/ControllerSettingsRepo'
import PDSRepo from '@/modules/settings/repositories/PDSRepo'
import { IUseCase } from '@/modules/IUseCase'
import FetchControllerSettings from '@/modules/settings/usecases/FetchControllerSettings'
import SaveControllerSettings from '@/modules/settings/usecases/SaveControllerSettings'
import ActivatePDS from '@/modules/settings/usecases/ActivatePDS'
import FetchActivePDS from '@/modules/settings/usecases/FetchActivePDS'
import FetchPDSList from '@/modules/settings/usecases/FetchPDSList'

const container: Container = new Container()

container.bind<ControllerSettingsRepo>(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
  .to(ControllerSettingsRepo)
container.bind<IUseCase>(SI.SETTINGS.USE_CASE.FETCH_CONTROLLER_SETTINGS)
  .to(FetchControllerSettings)
container.bind<IUseCase>(SI.SETTINGS.USE_CASE.SAVE_CONTROLLER_SETTINGS)
  .to(SaveControllerSettings)

container.bind<PDSRepo>(SI.SETTINGS.REPOSITORY.PDS_REPO)
  .to(PDSRepo)
container.bind<IUseCase>(SI.SETTINGS.USE_CASE.FETCH_ACTIVE_PDS)
  .to(FetchActivePDS)

container.bind<IUseCase>(SI.SETTINGS.USE_CASE.FETCH_PDS_LIST)
  .to(FetchPDSList)

container.bind<IUseCase>(SI.SETTINGS.USE_CASE.ACTIVATE_PDS)
  .to(ActivatePDS)

export default container
