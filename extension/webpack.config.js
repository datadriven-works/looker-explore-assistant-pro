const fs = require("fs");
const path = require("path");
const Dotenv = require('dotenv-webpack');

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
if (!process.env.POSTS_SERVER_URL) {
  // webpack 5 is stricter about environment variables. The POSTS_SERVER_URL
  // environment variable was not mentioned in the README so default it for
  // those developers who may have created a .env file without the variable.
  process.env.POSTS_SERVER_URL = "http://127.0.0.1:3000";
}

const PATHS = {
  app: path.join(__dirname, "src/index.tsx"),
};

module.exports = {
  entry: {
    app: PATHS.app,
  },
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        ],
      },
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader', // Creates `style` nodes from JS strings
          'css-loader',   // Translates CSS into CommonJS
          {
            loader: 'postcss-loader', // Processes CSS with PostCSS
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'), // Add Tailwind as a PostCSS plugin
                  require('autoprefixer'), // Add Autoprefixer as a PostCSS plugin
                ],
              },
            },
          },
        ],
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
      {
        test: /\.ya?ml$/,
        use: 'yaml-loader'
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: { buffer: false, process: require.resolve("process/browser") },
  },
  devtool: "source-map",
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE_MODE || "disabled",
    }),
    new Dotenv()
  ],
};

