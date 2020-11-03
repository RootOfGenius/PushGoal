module.exports = {
  lintOnSave: false,
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    },
    devtools: {
      template: 'public/browser-extension.html',
      entry: './src/devtools/main.js',
      title: 'Devtools'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {}
    }
  }
}
