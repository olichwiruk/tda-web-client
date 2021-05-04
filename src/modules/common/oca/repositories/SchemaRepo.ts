import { injectable } from 'inversify'
import axios from 'axios'
import { Dictionary } from '@/types'
import { Schema } from '@/modules/common/oca/entities'

@injectable()
export class SchemaRepo {
  async byDRI ({ ocaRepoUrl, dri }: { ocaRepoUrl: string, dri: string }) {
    const response = (await axios.get(`${ocaRepoUrl}/api/v3/schemas/${dri}`)).data as Dictionary
    const schemaBase = response.schema_base as Dictionary
    const overlays = response.overlays as Dictionary[]

    return new Schema({ dri, schemaBase, overlays })
  }
}
