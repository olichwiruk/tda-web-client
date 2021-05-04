import { Container } from 'inversify'
import SI from '@/modules/common/oca/Identifiers'
import { UseCase } from '@/modules/UseCase'
import { SchemaRepo, FormRepo } from '@/modules/common/oca/repositories'
import { FetchForm, SaveForms } from '@/modules/common/oca/usecases'

const container: Container = new Container()

container.bind<SchemaRepo>(SI.COMMON.OCA.REPOSITORY.SCHEMA_REPO)
  .to(SchemaRepo)

container.bind<FormRepo>(SI.COMMON.OCA.REPOSITORY.FORM_REPO)
  .toConstantValue(new FormRepo())

container.bind<UseCase>(SI.COMMON.OCA.USE_CASE.FETCH_FORM)
  .to(FetchForm)

container.bind<UseCase>(SI.COMMON.OCA.USE_CASE.SAVE_FORMS)
  .to(SaveForms)

export default container
