import 'reflect-metadata'
import { Container } from 'inversify'
import commonAPIContainer from '@/modules/common/api/CompositionRoot'
import commonOCAContainer from '@/modules/common/oca/CompositionRoot'
import settingsContainer from '@/modules/settings/CompositionRoot'

export default Container.merge(
  commonAPIContainer,
  commonOCAContainer,
  settingsContainer
)
