import { boot } from 'quasar/wrappers'
import container from '../CompositionRoot'
import { vueInversifyPlugin } from '@vanroeybe/vue-inversify-plugin'

export default boot(({ app }) => {
  app.use(vueInversifyPlugin(container))
})
