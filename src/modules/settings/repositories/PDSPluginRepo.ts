import axios from 'axios'
import ControllerSettings from '@/modules/settings/entities/ControllerSettings'
import PDSPlugin from '@/modules/settings/entities/PDSPlugin'
import { Dictionary } from '@/types'

export default class {
  controllerSettings: ControllerSettings

  constructor (controllerSettings: ControllerSettings) {
    this.controllerSettings = controllerSettings
  }

  async all () {
    const results: PDSPlugin[] = []
    const response = (
      await axios.get(`${this.controllerSettings.acapyApiUrl}/pds`)
    ).data as Dictionary
    Object.entries(response.types).forEach(([type, value]) => {
      const pdsPlugin = new PDSPlugin(type, (value as Record<string, string>).oca_schema_dri)
      results.push(pdsPlugin)
    })

    return results
  }
}
