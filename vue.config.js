const webpack = require('webpack');

module.exports = {
  runtimeCompiler: true,

  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jquery: 'jquery',
        'window.jQuery': 'jquery',
        jQuery: 'jquery'
      })
    ]
  },

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
