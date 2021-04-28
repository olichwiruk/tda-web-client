import 'reflect-metadata'
import { Container } from 'inversify'
import settingsContainer from '@/modules/settings/CompositionRoot'
const container = new Container()

export default Container.merge(container, settingsContainer)
