import { Container } from 'inversify'
import SI from '@/modules/settings/Identifiers'
import { UseCase } from '@/modules/UseCase'
import {
  ControllerSettingsRepo,
  PDSDriverRepo,
  PDSRepo
} from '@/modules/settings/repositories'
import {
  FetchControllerSettings,
  SaveControllerSettings,
  ActivatePDS,
  FetchActivePDS,
  FetchPDSList,
  FetchPDSDriverList
} from '@/modules/settings/usecases'

const container: Container = new Container()

container.bind<ControllerSettingsRepo>(SI.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
  .to(ControllerSettingsRepo)
container.bind<UseCase>(SI.SETTINGS.USE_CASE.FETCH_CONTROLLER_SETTINGS)
  .to(FetchControllerSettings)
container.bind<UseCase>(SI.SETTINGS.USE_CASE.SAVE_CONTROLLER_SETTINGS)
  .to(SaveControllerSettings)

container.bind<PDSRepo>(SI.SETTINGS.REPOSITORY.PDS_REPO)
  .to(PDSRepo)
container.bind<UseCase>(SI.SETTINGS.USE_CASE.FETCH_ACTIVE_PDS)
  .to(FetchActivePDS)

container.bind<UseCase>(SI.SETTINGS.USE_CASE.FETCH_PDS_LIST)
  .to(FetchPDSList)

container.bind<UseCase>(SI.SETTINGS.USE_CASE.ACTIVATE_PDS)
  .to(ActivatePDS)

container.bind<PDSDriverRepo>(SI.SETTINGS.REPOSITORY.PDS_DRIVER_REPO)
  .to(PDSDriverRepo)
container.bind<UseCase>(SI.SETTINGS.USE_CASE.FETCH_PDS_DRIVER_LIST)
  .to(FetchPDSDriverList)

export default container
