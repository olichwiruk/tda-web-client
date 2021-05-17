import { injectable, inject } from 'inversify'
import { UseCase } from '@/modules/UseCase'
import { Schema, Form } from '@/modules/common/oca/entities'
import { renderForm } from '@/js/oca.js-vue'
import SI_SETTINGS from '@/modules/settings/Identifiers'
import SI from '@/modules/common/oca/Identifiers'
import { ControllerSettingsRepo } from '@/modules/settings/repositories'
import { SchemaRepo, FormRepo } from '@/modules/common/oca/repositories'

@injectable()
export class SaveForms implements UseCase {
  controllerSettingsRepo: ControllerSettingsRepo
  schemaRepo: SchemaRepo
  formRepo: FormRepo

  constructor (
    @inject(SI_SETTINGS.SETTINGS.REPOSITORY.CONTROLLER_SETTINGS_REPO)
      controllerSettingsRepo: ControllerSettingsRepo,
    @inject(SI.COMMON.OCA.REPOSITORY.SCHEMA_REPO)
      schemaRepo: SchemaRepo,
    @inject(SI.COMMON.OCA.REPOSITORY.FORM_REPO)
      formRepo: FormRepo
  ) {
    this.controllerSettingsRepo = controllerSettingsRepo
    this.schemaRepo = schemaRepo
    this.formRepo = formRepo
  }

  call ({ driList }: { driList: string[] }) {
    const ocaRepoUrl = this.controllerSettingsRepo.get().ocaRepoUrl
    const schemasPromises = driList.reduce((accumulator, currentValue) => {
      if (!this.formRepo.byDRI(currentValue)) {
        accumulator.push(this.schemaRepo.byDRI({ ocaRepoUrl, dri: currentValue }))
      }
      return accumulator
    }, [] as Promise<Schema>[])
    // eslint-disable-next-line
    schemasPromises.forEach(async schemaPromise => {
      try {
        const schema = await schemaPromise
        const form = await this.renderOcaForm(schema)
        this.formRepo.save(form)
      } catch (e) {
        console.error(e)
      }
    })
  }

  async renderOcaForm (ocaSchema: Schema) {
    const schema = [ocaSchema.base, ...ocaSchema.overlays]
    return new Form((await renderForm(schema, ocaSchema.dri)).form)
  }
}
