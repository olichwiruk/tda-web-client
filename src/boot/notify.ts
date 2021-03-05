import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
  const $q = app.config.globalProperties.$q

  $q.notify.setDefaults({
    position: 'top',
    timeout: 2000,
    textColor: 'white'
  })

  app.config.globalProperties.$notify = {
    success: (msg: string) => {
      $q.notify({
        type: 'positive',
        message: msg,
        progress: true,
      })
    },
    error: (msg: string) => {
      $q.notify({
        type: 'negative',
        message: msg,
        progress: true,
      })
    },
  }
})
