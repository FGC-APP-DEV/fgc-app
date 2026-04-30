const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
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
};
