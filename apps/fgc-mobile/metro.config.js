const path = require('path')
const { getDefaultConfig } = require('@react-native/metro-config')

const workspaceRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(__dirname)

config.watchFolders = [workspaceRoot]
config.resolver = config.resolver || {}
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(__dirname, 'node_modules'),
]
config.resolver.extraNodeModules = {
  '@fgc/shared': path.resolve(workspaceRoot, 'libs/shared/src'),
  '@fgc/graphql': path.resolve(workspaceRoot, 'libs/graphql/src'),
  '@fgc/ui': path.resolve(workspaceRoot, 'libs/ui/src'),
  '@fgc/auth': path.resolve(workspaceRoot, 'libs/auth/src'),
  '@fgc/judging': path.resolve(workspaceRoot, 'libs/judging/src'),
}

module.exports = config
