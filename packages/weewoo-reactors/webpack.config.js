/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true, // This goes a lot faster and it's safe since we have a separate build step
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    modules: ['node_modules', '../../node_modules'],
  },
  output: {
    filename: 'build.js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'build'),
  },
}
