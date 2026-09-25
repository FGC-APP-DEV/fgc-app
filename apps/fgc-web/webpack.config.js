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
  API_BASE_URL: '/api/v1',
  // Set only by `npm run dev:mock`; enables the mock account picker.
  FGC_MOCK: !isProduction && process.env.FGC_MOCK === '1' ? '1' : '',
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
      ...Object.fromEntries(
        Object.entries(require('../../tsconfig.base.json').compilerOptions.paths).map(
          ([name, files]) => [name, path.resolve(workspaceRoot, files[0])],
        ),
      ),
      '@fgc/ui': path.resolve(workspaceRoot, 'libs/ui/src/index.ts'),
      '@fgc/auth': path.resolve(workspaceRoot, 'libs/auth/src/index.ts'),
      '@fgc/judging': path.resolve(workspaceRoot, 'libs/judging/src/index.ts'),
    },
  },
  module: {
    rules: [
      { test: /\.(ttf|png|jpg|svg|webp)$/, type: 'asset/resource' },
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
    proxy: [
      {
        context: ['/api', '/health', '/__mock'],
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    ],
    allowedHosts: ['.docker.internal', 'localhost', '.localhost'],
  },
}
