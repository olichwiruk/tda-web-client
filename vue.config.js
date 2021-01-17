module.exports = {
  runtimeCompiler: true,

  devServer: {
    allowedHosts: [
      'toolbox.localhost',
      'toolbox1.localhost',
      'toolbox2.localhost'
    ]
  },

  pluginOptions: {
    quasar: {
      importStrategy: 'kebab',
      rtlSupport: false,
    }
  },

  transpileDependencies: [
    'quasar'
  ]
}
