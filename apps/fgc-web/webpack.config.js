const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity')
const webpack = require('webpack')
const dotenv = require('dotenv')

const appRoot = __dirname
const workspaceRoot = path.resolve(__dirname, '../..')

const envPath = path.resolve(workspaceRoot, '.env.local')
const fileEnv = dotenv.config({ path: envPath }).parsed || {}

const getEnv = (key, defaultValue = '') => {
  return process.env[key] || fileEnv[key] || defaultValue
}

const isProduction = process.env.NODE_ENV === 'production'

const clientEnv = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  REACT_APP_API_URL: getEnv('REACT_APP_API_URL', 'http://localhost:4000'),
}

module.exports = {
  mode: isProduction ? 'production' : 'development',
  context: workspaceRoot,
  entry: path.resolve(appRoot, 'src/index.tsx'),
  output: {
    path: path.resolve(workspaceRoot, 'dist/apps/fgc-web'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    crossOriginLoading: 'anonymous',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
    modules: [path.resolve(workspaceRoot, 'node_modules'), 'node_modules'],
    alias: {
      'react-native$': 'react-native-web',
      '@fgc/shared': path.resolve(workspaceRoot, 'libs/shared/src/index.ts'),
      '@fgc/graphql': path.resolve(workspaceRoot, 'libs/graphql/src/index.ts'),
      '@fgc/ui': path.resolve(workspaceRoot, 'libs/ui/src/index.ts'),
      '@fgc/auth': path.resolve(workspaceRoot, 'libs/auth/src/index.ts'),
      '@fgc/judging': path.resolve(workspaceRoot, 'libs/judging/src/index.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(appRoot, 'tsconfig.app.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appRoot, 'src/index.html'),
    }),
    new SubresourceIntegrityPlugin(),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(clientEnv),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
    allowedHosts: ['.docker.internal', 'localhost', '.localhost'],
  },
}
