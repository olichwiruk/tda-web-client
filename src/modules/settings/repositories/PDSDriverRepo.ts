import axios from 'axios'
import { Dictionary } from '@/types'
import {
  ControllerSettings,
  PDSDriver
} from '@/modules/settings/entities'

export class PDSDriverRepo {
  controllerSettings: ControllerSettings

  constructor (controllerSettings: ControllerSettings) {
    this.controllerSettings = controllerSettings
  }

  async all () {
    const results: PDSDriver[] = []
    const response = (
      await axios.get(`${this.controllerSettings.acapyApiUrl}/pds`)
    ).data as Dictionary
    Object.entries(response.types).forEach(([type, value]) => {
      const pdsPlugin = new PDSDriver(type, (value as Record<string, string>).oca_schema_dri)
      results.push(pdsPlugin)
    })

    return results
  }
}
