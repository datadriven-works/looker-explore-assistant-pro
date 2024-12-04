const commonConfig = require('./webpack.config')

module.exports = {
  ...commonConfig,
  output: {
    ...commonConfig.output,
    publicPath: 'https://localhost:8080/',
  },
  mode: 'development',
  module: {
    rules: [
      ...commonConfig.module.rules,
    ],
  },
  devServer: {
    webSocketServer: 'sockjs',
    client: {
      overlay: false
    },
    host: 'localhost',
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    watchFiles: {
      options: {
        ignored: /node_modules/,
      }
    }
  },
  plugins: [...commonConfig.plugins],
  devtool: 'cheap-module-source-map',
}
