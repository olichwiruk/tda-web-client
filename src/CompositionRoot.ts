import 'reflect-metadata'
import { Container } from 'inversify'
import commonOCAContainer from '@/modules/common/oca/CompositionRoot'
import settingsContainer from '@/modules/settings/CompositionRoot'

export default Container.merge(commonOCAContainer, settingsContainer)
