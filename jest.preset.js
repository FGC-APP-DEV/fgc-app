const { coverageReporters: _coverageReporters, ...nxPreset } =
  require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: Object.fromEntries(
    Object.entries(require('./tsconfig.base.json').compilerOptions.paths).map(
      ([name, paths]) => ['^' + name + '$', require('path').resolve(__dirname, paths[0])],
    ),
  ),
  transform: {
    '^.+\\.(ts|js|tsx|jsx|html)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },
}
