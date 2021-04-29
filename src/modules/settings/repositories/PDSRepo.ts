import { injectable } from 'inversify'
import PDS from '@/modules/settings/entities/PDS'
import axios from 'axios'
import { Dictionary } from '@/types'

@injectable()
export default class {
  async getActive ({ apiUrl }: { apiUrl: string }): Promise<PDS> {
    const response = (await axios.get(`${apiUrl}/pds`)).data as Dictionary
    const [type, name]: string[] = (response.active as string).split(', ')

    return new PDS({ type, name })
  }

  async all ({ apiUrl }: { apiUrl: string }): Promise<PDS[]> {
    const result: PDS[] = []
    const response = (await axios.get(`${apiUrl}/pds/settings`)).data as Dictionary

    Object.keys(response).forEach(pds => {
      const [type, name]: string[] = pds.split(', ')
      result.push(new PDS({ type, name }))
    })

    return result
  }

  save ({ apiUrl, pds }: { apiUrl: string, pds: PDS }) {
    if (pds.active) {
      void axios.post(`${apiUrl}/pds/activate?type=${pds.type}&optional_name=${pds.name}`)
    }
  }
}
