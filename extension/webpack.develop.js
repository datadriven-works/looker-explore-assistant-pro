const path = require('path');
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
      {
        test: /\.(js|jsx|ts|tsx)?$/,
        include: /node_modules/,
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Ensure you specify the public directory if necessary
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    allowedHosts: 'all', // Set to 'auto' to allow any host or use an array for specific hosts
    port: 8080,
    liveReload: true,
    hot: true,
    client: {
      overlay: true, // Show errors and warnings overlay in the browser
      webSocketURL: {
        hostname: 'localhost',
        port: 8080,
        protocol: 'wss',
      },
    },
    server: {
      type: 'https',
    },
  },
  plugins: [...commonConfig.plugins],
}
