const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')

// Create .env file if it does not exist
if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env_example', '.env')
}
const env = dotenv.config().parsed

const PATHS = {
  app: path.join(__dirname, 'src/index.tsx'),
}

module.exports = {
  entry: {
    app: PATHS.app,
  },
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: /src/
      },
      {
        test: /\.(css)$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(scss|sass)$/i,
        use: ["style-loader", "css-loader", 'postcss-loader', "sass-loader"],
        include: /src/,
        exclude: /node_modules/,
      },
      {
        test: /\.md$/,
        use: 'raw-loader',
        exclude: /node_modules/,
        include: /src\/documents/,
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      buffer: false,
      process: require.resolve('process/browser'),
    },
  },
  devtool: 'source-map',
  plugins: [
    new webpack.EnvironmentPlugin(Object.keys(env)),
  ],
  cache: {
    type: 'filesystem',
  },
}
