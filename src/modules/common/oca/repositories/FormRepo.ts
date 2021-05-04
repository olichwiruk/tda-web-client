import { injectable } from 'inversify'
import { Form } from '@/modules/common/oca/entities'
import { Nullable } from '@/types'

@injectable()
export class FormRepo {
  registry: Form[]

  constructor () {
    this.registry = []
  }

  save (form: Form) {
    if (this.byDRI(form.dri)) { return }
    this.registry.push(form)
  }

  byDRI (dri: string): Nullable<Form> {
    return this.registry.find(form => form.dri === dri)
  }
}
