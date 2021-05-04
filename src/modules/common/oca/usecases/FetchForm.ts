import { injectable, inject } from 'inversify'
import { UseCase } from '@/modules/UseCase'
import SI from '@/modules/common/oca/Identifiers'
import { FormRepo } from '@/modules/common/oca/repositories'

@injectable()
export class FetchForm implements UseCase {
  formRepo: FormRepo

  constructor (
    @inject(SI.COMMON.OCA.REPOSITORY.FORM_REPO)
      formRepo: FormRepo
  ) {
    this.formRepo = formRepo
  }

  call (dri: string) {
    return this.formRepo.byDRI(dri)
  }
}
