import { injectable } from 'inversify'
import axios from 'axios'
import { Dictionary } from '@/types'
import {
  PDSDriver
} from '@/modules/settings/entities'

@injectable()
export class PDSDriverRepo {
  async all ({ apiUrl }: { apiUrl: string }) {
    const results: PDSDriver[] = []
    const response = (await axios.get(`${apiUrl}/pds`)).data as Dictionary
    Object.entries(response.types).forEach(([type, value]) => {
      const pdsPlugin = new PDSDriver(type, (value as Record<string, string>).oca_schema_dri)
      results.push(pdsPlugin)
    })

    return results
  }
}
