import { Container } from 'inversify'
import SI from '@/modules/common/api/Identifiers'
import Storage from '@/storage'
import { HttpClient } from '@/api/http-client'
import { Applications } from '@/api/Applications'
import { Connections } from '@/api/Connections'
import { Consents } from '@/api/Consents'
import { Documents } from '@/api/Documents'
import { Pds } from '@/api/Pds'
import { PresentationRequests } from '@/api/PresentationRequests'
import { Presentations } from '@/api/Presentations'
import { Services } from '@/api/Services'

const container: Container = new Container()

container.bind<HttpClient>(SI.COMMON.API.HTTP_CLIENT)
  .toDynamicValue(() => (
    new HttpClient({ baseURL: Storage.get(Storage.Record.AdminApiUrl) || '' })
  ))

container.bind<Applications>(SI.COMMON.API.APPLICATIONS).to(Applications)
container.bind<Connections>(SI.COMMON.API.CONNECTIONS).to(Connections)
container.bind<Consents>(SI.COMMON.API.CONSENTS).to(Consents)
container.bind<Documents>(SI.COMMON.API.DOCUMENTS).to(Documents)
container.bind<Pds>(SI.COMMON.API.PDS).to(Pds)
container.bind<PresentationRequests>(SI.COMMON.API.PRESENTATION_REQUESTS)
  .to(PresentationRequests)
container.bind<Presentations>(SI.COMMON.API.PRESENTATIONS).to(Presentations)
container.bind<Services>(SI.COMMON.API.SERVICES).to(Services)

export default container
